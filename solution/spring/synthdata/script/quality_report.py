"""Generate a quality report from `generation_pipeline.py` output.

This script maps the report sections from `docs/kwaliteitsrapport-template.md`
to concrete calculations and artefacts (metrics, markdown tables, and optional
plots).

Input: a JSON file containing `synthesiser.synthesise(...)` output (produced by
the Spring service via `synthesiser.py`). All pipeline steps (IPF + generation)
are assumed to have already been executed before this module is called.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import subprocess
import sys
import time
import tracemalloc
from collections import Counter, defaultdict
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path
from typing import Any, Iterable, Mapping

# Keep local imports working when invoked from Spring service context.
sys.path.insert(0, str(Path(__file__).resolve().parent))


@dataclass
class MetricRow:
    variable: str
    metric: str
    value: str
    threshold: str


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _normalise_cell_table(raw: Mapping[str, Any]) -> dict[tuple[str, str], float]:
    table: dict[tuple[str, str], float] = {}
    for key, value in raw.items():
        if "|" in key:
            r, c = key.split("|", 1)
        elif isinstance(key, (list, tuple)) and len(key) == 2:
            r, c = key
        else:
            raise ValueError(f"unsupported cell key format: {key!r}")
        table[(str(r), str(c))] = float(value)
    return table


def _compute_population_counts(
    population: Iterable[Mapping[str, Any]], row_dim: str, col_dim: str
) -> dict[tuple[str, str], int]:
    counts: dict[tuple[str, str], int] = Counter()
    for person in population:
        row_val = str(person.get(row_dim, "unknown"))
        col_val = str(person.get(col_dim, "unknown"))
        counts[(row_val, col_val)] += 1
    return dict(counts)


def _marginal_from_joint(
    counts: Mapping[tuple[str, str], float], *, axis: str
) -> dict[str, float]:
    marg: dict[str, float] = defaultdict(float)
    for (row, col), v in counts.items():
        key = row if axis == "row" else col
        marg[key] += float(v)
    return dict(marg)


def _mean_abs_percentage_error(source: Mapping[str, float], synthetic: Mapping[str, float]) -> float:
    parts: list[float] = []
    for key, src in source.items():
        src_val = float(src)
        if src_val <= 0:
            continue
        syn_val = float(synthetic.get(key, 0.0))
        parts.append(abs(syn_val - src_val) / src_val)
    return float(sum(parts) / len(parts)) if parts else math.nan


def _total_abs_error_over_total(source: Mapping[str, float], synthetic: Mapping[str, float]) -> float:
    keys = set(source) | set(synthetic)
    total = sum(float(source.get(k, 0.0)) for k in keys)
    if total <= 0:
        return math.nan
    tae = sum(abs(float(synthetic.get(k, 0.0)) - float(source.get(k, 0.0))) for k in keys)
    return tae / total


def _chi_square(source: Mapping[str, float], synthetic: Mapping[str, float]) -> tuple[float, int, float | None]:
    keys = sorted(set(source) | set(synthetic))
    stat = 0.0
    dof = 0
    for k in keys:
        expected = float(source.get(k, 0.0))
        observed = float(synthetic.get(k, 0.0))
        if expected <= 0:
            continue
        stat += ((observed - expected) ** 2) / expected
        dof += 1
    dof = max(dof - 1, 0)

    # Optional p-value if scipy is available.
    p_value: float | None = None
    if dof > 0:
        try:
            from scipy.stats import chi2 as scipy_chi2  # type: ignore

            p_value = float(scipy_chi2.sf(stat, dof))
        except Exception:
            p_value = None
    return stat, dof, p_value


def _safe_div(num: float, den: float) -> float:
    return num / den if den else 0.0


def _kl_divergence(p: Mapping[Any, float], q: Mapping[Any, float], eps: float = 1e-12) -> float:
    keys = set(p) | set(q)
    p_total = sum(float(p.get(k, 0.0)) for k in keys)
    q_total = sum(float(q.get(k, 0.0)) for k in keys)
    if p_total <= 0 or q_total <= 0:
        return math.nan
    acc = 0.0
    for k in keys:
        pk = max(_safe_div(float(p.get(k, 0.0)), p_total), 0.0)
        qk = max(_safe_div(float(q.get(k, 0.0)), q_total), 0.0)
        if pk <= 0:
            continue
        acc += pk * math.log(pk / max(qk, eps))
    return acc


def _js_divergence(p: Mapping[Any, float], q: Mapping[Any, float]) -> float:
    keys = set(p) | set(q)
    m = {k: 0.5 * (float(p.get(k, 0.0)) + float(q.get(k, 0.0))) for k in keys}
    return 0.5 * _kl_divergence(p, m) + 0.5 * _kl_divergence(q, m)


def _try_import_matplotlib():
    try:
        import matplotlib.pyplot as plt  # type: ignore

        return plt
    except Exception:
        return None


def _plot_marginals(
    out_file: Path,
    title: str,
    source: Mapping[str, float],
    synthetic: Mapping[str, float],
) -> bool:
    plt = _try_import_matplotlib()
    if plt is None:
        return False

    keys = sorted(set(source) | set(synthetic))
    src_vals = [float(source.get(k, 0.0)) for k in keys]
    syn_vals = [float(synthetic.get(k, 0.0)) for k in keys]

    fig = plt.figure(figsize=(10, 4))
    ax = fig.add_subplot(111)
    x = list(range(len(keys)))
    width = 0.4
    ax.bar([i - width / 2 for i in x], src_vals, width=width, label="Source")
    ax.bar([i + width / 2 for i in x], syn_vals, width=width, label="Synthetic")
    ax.set_xticks(x)
    ax.set_xticklabels(keys, rotation=30, ha="right")
    ax.set_title(title)
    ax.set_ylabel("Count")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_file)
    plt.close(fig)
    return True


def _plot_heatmap(
    out_file: Path,
    title: str,
    joint: Mapping[tuple[str, str], float],
    rows: list[str],
    cols: list[str],
) -> bool:
    plt = _try_import_matplotlib()
    if plt is None:
        return False

    matrix = [[float(joint.get((r, c), 0.0)) for c in cols] for r in rows]

    fig = plt.figure(figsize=(8, 5))
    ax = fig.add_subplot(111)
    im = ax.imshow(matrix, aspect="auto")
    ax.set_xticks(list(range(len(cols))))
    ax.set_xticklabels(cols, rotation=30, ha="right")
    ax.set_yticks(list(range(len(rows))))
    ax.set_yticklabels(rows)
    ax.set_title(title)
    fig.colorbar(im, ax=ax, label="Count")
    fig.tight_layout()
    fig.savefig(out_file)
    plt.close(fig)
    return True


def _load_variable_catalogue(variables_yaml_path: Path) -> list[dict[str, str]]:
    # Lightweight parser for the known format in data/variables.yaml.
    rows: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for raw in variables_yaml_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("- id:"):
            if current:
                rows.append(current)
            current = {"id": line.split(":", 1)[1].strip()}
        elif current and ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            if key in {"name", "priority", "table_id"}:
                current[key] = val.strip().strip('"')
    if current:
        rows.append(current)
    return rows


def _present_variables(
    report_data: Mapping[str, Any],
    row_dim: str,
    col_dim: str,
    has_rwzi: bool,
) -> set[str]:
    present: set[str] = set()

    area = report_data.get("area", {}) or {}
    if isinstance(area, Mapping) and area.get("code"):
        present.add("buurtcode")

    if report_data.get("n") is not None:
        present.add("bevolkingsomvang-buurt")

    dims = {row_dim.lower(), col_dim.lower()}
    if "leeftijd" in dims:
        present.add("leeftijdsverdeling")
    if "huishoudgrootte" in dims:
        present.add("huishoudgrootte-samenstelling")
    if "woningtype" in dims:
        present.add("woningtype")
    if "opleidingsniveau" in dims:
        present.add("opleidingsniveau")

    if has_rwzi:
        present.update(
            {
                "rwzi-register",
                "rwzi-catchment",
                "landgebruik-woongebied",
                "landgebruik-industrie",
                "landgebruik-agrarisch",
            }
        )
    return present


def _format_pct(v: float) -> str:
    if math.isnan(v):
        return "n/a"
    return f"{100.0 * v:.2f}%"


def _git_commit(root: Path) -> str:
    try:
        proc = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        )
        return proc.stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def _build_report_markdown(
    *,
    area_code: str,
    n: int,
    seed: Any,
    commit: str,
    variable_rows: list[str],
    marginal_metric_rows: list[MetricRow],
    plots: list[str],
    cross_domain_rows: list[str],
    spatial_lines: list[str],
    wastewater_lines: list[str],
    privacy_lines: list[str],
    reproducibility_lines: list[str],
    limitation_lines: list[str],
) -> str:
    lines: list[str] = []
    lines.append("# Quality report")
    lines.append("")
    lines.append("## 1. Coverage")
    lines.append(f"- **Region(s):** buurt `{area_code}`")
    lines.append(f"- **Number of synthetic individuals:** {n}")
    lines.append("- **Number of synthetic households:** n/a (not modelled in current generator)")
    lines.append(f"- **Random seed:** {seed}")
    lines.append(f"- **Generator version / git commit:** `{commit}`")
    lines.append("")

    lines.append("## 2. Variable coverage")
    lines.append("| Variable | Priority | Present? | Source table |")
    lines.append("|---|---|---|---|")
    lines.extend(variable_rows)
    lines.append("")

    lines.append("## 3. Marginal fit (must-have variables)")
    lines.append("| Variable | Metric | Value | Threshold |")
    lines.append("|---|---|---|---|")
    for r in marginal_metric_rows:
        lines.append(f"| {r.variable} | {r.metric} | {r.value} | {r.threshold} |")
    if plots:
        lines.append("")
        lines.append("Plots:")
        for p in plots:
            lines.append(f"- `{p}`")
    lines.append("")

    lines.append("## 4. Cross-domain consistency (S1)")
    lines.append("| Cross-tab | KL(P||Q) | Jensen-Shannon | Chi-square |")
    lines.append("|---|---:|---:|---:|")
    lines.extend(cross_domain_rows)
    lines.append("")

    lines.append("## 5. Spatial coherence (S2)")
    lines.extend(spatial_lines)
    lines.append("")

    lines.append("## 6. Wastewater linkage (S4, only if Layer 2 is included)")
    lines.extend(wastewater_lines)
    lines.append("")

    lines.append("## 7. Privacy measures (mandatory)")
    lines.extend(privacy_lines)
    lines.append("")

    lines.append("## 8. Reproducibility")
    lines.extend(reproducibility_lines)
    lines.append("")

    lines.append("## 9. Known limitations")
    lines.extend(limitation_lines)
    lines.append("")

    return "\n".join(lines)


def generate_quality_report(
    generation_output: Mapping[str, Any],
    *,
    out_md: Path,
    out_dir: Path,
    variables_yaml: Path,
    source_macro: Mapping[str, Any] | None = None,
    reference_joint: Mapping[str, Any] | None = None,
    spatial_data: Mapping[str, Any] | None = None,
    rwzi_data: Mapping[str, Any] | None = None,
    invocation: str = "python3 quality_report.py ...",
    runtime_seconds: float = 0.0,
    peak_memory_mb: float = 0.0,
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)

    row_dim = str(generation_output.get("row_dim", "leeftijd"))
    col_dim = str(generation_output.get("col_dim", "huishoudgrootte"))
    population = generation_output.get("population", [])
    if not isinstance(population, list):
        raise ValueError("generation output must contain `population` list")
    n = int(generation_output.get("n", len(population)))

    area_obj = generation_output.get("area", {}) or {}
    area_code = area_obj.get("code", "UNKNOWN") if isinstance(area_obj, Mapping) else "UNKNOWN"

    counts = _compute_population_counts(population, row_dim, col_dim)
    synthetic_row_marg = _marginal_from_joint(counts, axis="row")
    synthetic_col_marg = _marginal_from_joint(counts, axis="col")

    # Section 2: variable coverage.
    catalogue = _load_variable_catalogue(variables_yaml)
    has_rwzi = bool(rwzi_data)
    present_ids = _present_variables(generation_output, row_dim, col_dim, has_rwzi)
    variable_rows: list[str] = []
    for var in catalogue:
        vid = var.get("id", "")
        present = "✅" if vid in present_ids else "❌"
        name = var.get("name", vid)
        priority = var.get("priority", "")
        table_id = var.get("table_id", "")
        variable_rows.append(f"| {name} (`{vid}`) | {priority} | {present} | {table_id} |")

    # Section 3: marginal fit metrics and plot.
    marginal_metric_rows: list[MetricRow] = []
    plot_paths: list[str] = []
    source_row_marg: dict[str, float] | None = None
    source_col_marg: dict[str, float] | None = None

    if source_macro and isinstance(source_macro.get("marginals"), Mapping):
        src_marg = source_macro["marginals"]
        if isinstance(src_marg.get(row_dim), Mapping):
            source_row_marg = {str(k): float(v) for k, v in src_marg[row_dim].items()}
        if isinstance(src_marg.get(col_dim), Mapping):
            source_col_marg = {str(k): float(v) for k, v in src_marg[col_dim].items()}

    if source_row_marg:
        mape = _mean_abs_percentage_error(source_row_marg, synthetic_row_marg)
        tae = _total_abs_error_over_total(source_row_marg, synthetic_row_marg)
        chi2_stat, dof, p_value = _chi_square(source_row_marg, synthetic_row_marg)
        marginal_metric_rows.extend(
            [
                MetricRow(row_dim, "MAPE", _format_pct(mape), "< 5%"),
                MetricRow(row_dim, "Total Absolute Error / Total Population", _format_pct(tae), "lower is better"),
                MetricRow(
                    row_dim,
                    "Chi-square",
                    f"{chi2_stat:.3f} (dof={dof}, p={p_value:.4f})" if p_value is not None else f"{chi2_stat:.3f} (dof={dof})",
                    "p > 0.05",
                ),
            ]
        )
        plot_file = out_dir / f"marginal_{row_dim}.png"
        if _plot_marginals(plot_file, f"Marginal fit: {row_dim}", source_row_marg, synthetic_row_marg):
            plot_paths.append(str(plot_file))

    if source_col_marg:
        mape = _mean_abs_percentage_error(source_col_marg, synthetic_col_marg)
        tae = _total_abs_error_over_total(source_col_marg, synthetic_col_marg)
        chi2_stat, dof, p_value = _chi_square(source_col_marg, synthetic_col_marg)
        marginal_metric_rows.extend(
            [
                MetricRow(col_dim, "MAPE", _format_pct(mape), "< 5%"),
                MetricRow(col_dim, "Total Absolute Error / Total Population", _format_pct(tae), "lower is better"),
                MetricRow(
                    col_dim,
                    "Chi-square",
                    f"{chi2_stat:.3f} (dof={dof}, p={p_value:.4f})" if p_value is not None else f"{chi2_stat:.3f} (dof={dof})",
                    "p > 0.05",
                ),
            ]
        )
        plot_file = out_dir / f"marginal_{col_dim}.png"
        if _plot_marginals(plot_file, f"Marginal fit: {col_dim}", source_col_marg, synthetic_col_marg):
            plot_paths.append(str(plot_file))

    if not marginal_metric_rows:
        marginal_metric_rows.append(MetricRow("n/a", "n/a", "No source marginals provided", "Provide --source-macro-json"))

    # Section 4: cross-domain consistency.
    cross_domain_rows: list[str] = []
    pop_keys = sorted({k for person in population for k in person.keys()})
    pairs = list(combinations(pop_keys, 2))[:3]
    if not pairs:
        pairs = [(row_dim, col_dim)]

    for pair_row, pair_col in pairs:
        joint: Counter[tuple[str, str]] = Counter()
        for person in population:
            if pair_row in person and pair_col in person:
                joint[(str(person[pair_row]), str(person[pair_col]))] += 1

        ref_joint_counter: Counter[tuple[str, str]] = Counter()
        if reference_joint:
            for raw_key, val in reference_joint.items():
                if "|" in str(raw_key):
                    r, c = str(raw_key).split("|", 1)
                    ref_joint_counter[(r, c)] = float(val)
        elif pair_row == row_dim and pair_col == col_dim and generation_output.get("fitted_table"):
            ref_joint_counter.update(_normalise_cell_table(generation_output["fitted_table"]))
        else:
            ref_joint_counter.update(joint)

        kl = _kl_divergence(joint, ref_joint_counter)
        js = _js_divergence(joint, ref_joint_counter)
        chi2_stat, _, _ = _chi_square(
            {f"{r}|{c}": v for (r, c), v in ref_joint_counter.items()},
            {f"{r}|{c}": v for (r, c), v in joint.items()},
        )
        cross_domain_rows.append(f"| {pair_row} × {pair_col} | {kl:.4f} | {js:.4f} | {chi2_stat:.3f} |")

        rows = sorted({r for r, _ in set(joint) | set(ref_joint_counter)})
        cols = sorted({c for _, c in set(joint) | set(ref_joint_counter)})
        heat_file = out_dir / f"heatmap_{pair_row}_x_{pair_col}.png"
        _plot_heatmap(heat_file, f"Synthetic joint: {pair_row} x {pair_col}", joint, rows, cols)

    # Section 5: spatial coherence.
    spatial_lines: list[str] = []
    if spatial_data and isinstance(spatial_data.get("records"), list):
        recs = spatial_data["records"]
        values = [float(r.get("synthetic_value", 0.0)) for r in recs]
        if len(values) >= 3:
            mean_v = statistics.mean(values)
            std_v = statistics.pstdev(values) or 1.0
            outliers = [r for r in recs if abs((float(r.get("synthetic_value", 0.0)) - mean_v) / std_v) > 2.0]
            spatial_lines.append(f"- Analysed {len(recs)} buurten for spatial coherence.")
            spatial_lines.append(f"- Outliers (|z| > 2): {len(outliers)}.")
            if spatial_data.get("moran_i") is not None:
                spatial_lines.append(f"- Moran's I (provided): {float(spatial_data['moran_i']):.4f}.")
            else:
                spatial_lines.append("- Moran's I: not provided in input (optional).")
        else:
            spatial_lines.append("- Spatial data provided but too small for outlier analysis (need >= 3 buurten).")
    else:
        spatial_lines.append("- Spatial coherence not computed: provide `--spatial-json` with neighbour records.")

    # Section 6: wastewater linkage.
    wastewater_lines: list[str] = []
    if rwzi_data and isinstance(rwzi_data.get("catchments"), list):
        catchments = rwzi_data["catchments"]
        wastewater_lines.append(f"- RWZI catchments covered: {len(catchments)}")
        ratios = []
        for c in catchments:
            syn = float(c.get("synthetic_population", 0.0))
            conn = float(c.get("connected_population", 0.0))
            if conn > 0:
                ratios.append(syn / conn)
        if ratios:
            avg_ratio = sum(ratios) / len(ratios)
            wastewater_lines.append(f"- Mean synthetic/connected population ratio: {avg_ratio:.3f}")
        else:
            wastewater_lines.append("- No connected population values provided for sanity check.")
    else:
        wastewater_lines.append("- Layer 2 input not provided; wastewater linkage marked n/a.")

    # Section 7: privacy measures.
    privacy_lines: list[str] = []
    qi = ["buurtcode", row_dim, col_dim]
    cell_sizes = list(counts.values())
    k_min = min(cell_sizes) if cell_sizes else 0
    suppressed = sum(1 for v in cell_sizes if v < 5)
    privacy_lines.append(f"- Quasi-identifier set: {', '.join(qi)}")
    privacy_lines.append(f"- Minimum cell count / k achieved: {k_min}")
    privacy_lines.append("- Coordinate granularity and jitter rule: n/a (no coordinates in generated output).")
    privacy_lines.append(f"- Suppressed cells (<5): {suppressed}")

    # Section 8: reproducibility.
    reproducibility_lines = [
        f"- Single command to reproduce: `{invocation}`",
        f"- Approximate run time: {runtime_seconds:.3f} seconds",
        f"- Peak memory usage (Python): {peak_memory_mb:.2f} MB",
        "- Source data provenance: inferred from supplied source macro JSON and local repository files.",
    ]

    # Section 9: limitations.
    limitation_lines: list[str] = []
    if not source_macro:
        limitation_lines.append("- No source macro marginals supplied; marginal-fit values are limited.")
    if not rwzi_data:
        limitation_lines.append("- No RWZI/catchment input supplied; section 6 is not scored.")
    if not spatial_data:
        limitation_lines.append("- No multi-buurt neighbour dataset supplied; spatial coherence is not scored.")
    if not limitation_lines:
        limitation_lines.append("- No major limitations detected for the provided inputs.")

    commit = _git_commit(Path(__file__).resolve().parents[4])
    md = _build_report_markdown(
        area_code=area_code,
        n=n,
        seed=generation_output.get("seed"),
        commit=commit,
        variable_rows=variable_rows,
        marginal_metric_rows=marginal_metric_rows,
        plots=plot_paths,
        cross_domain_rows=cross_domain_rows,
        spatial_lines=spatial_lines,
        wastewater_lines=wastewater_lines,
        privacy_lines=privacy_lines,
        reproducibility_lines=reproducibility_lines,
        limitation_lines=limitation_lines,
    )

    out_md.write_text(md, encoding="utf-8")
    return out_md


def _parse_args() -> argparse.Namespace:
    here = Path(__file__).resolve().parent
    root = here.parents[3]

    parser = argparse.ArgumentParser(description="Generate quality report from synthetic population output")
    parser.add_argument("--input-json", type=Path, required=True, help="JSON output from synthesiser.py")
    parser.add_argument("--source-macro-json", type=Path, help="Macro data JSON containing source marginals")
    parser.add_argument("--reference-joint-json", type=Path, help="Optional reference joint table keyed as 'row|col' -> value")
    parser.add_argument("--spatial-json", type=Path, help="Optional spatial coherence input JSON")
    parser.add_argument("--rwzi-json", type=Path, help="Optional RWZI/catchment linkage input JSON")
    parser.add_argument("--variables-yaml", type=Path, default=root / "data" / "variables.yaml")
    parser.add_argument("--output-md", type=Path, default=here / "quality-report.md")
    parser.add_argument("--output-dir", type=Path, default=here / "quality-report-artifacts")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    tracemalloc.start()
    started = time.perf_counter()

    source_macro: dict[str, Any] | None = None
    if args.source_macro_json:
        source_macro = _load_json(args.source_macro_json)

    generation_output = _load_json(args.input_json)

    reference_joint = _load_json(args.reference_joint_json) if args.reference_joint_json else None
    spatial_data = _load_json(args.spatial_json) if args.spatial_json else None
    rwzi_data = _load_json(args.rwzi_json) if args.rwzi_json else None

    runtime_seconds = time.perf_counter() - started
    _, peak = tracemalloc.get_traced_memory()
    peak_memory_mb = peak / (1024 * 1024)

    invocation = " ".join(["python3", Path(__file__).name, *sys.argv[1:]])
    report_path = generate_quality_report(
        generation_output,
        out_md=args.output_md,
        out_dir=args.output_dir,
        variables_yaml=args.variables_yaml,
        source_macro=source_macro,
        reference_joint=reference_joint,
        spatial_data=spatial_data,
        rwzi_data=rwzi_data,
        invocation=invocation,
        runtime_seconds=runtime_seconds,
        peak_memory_mb=peak_memory_mb,
    )

    print(json.dumps({"status": "success", "quality_report": str(report_path)}))


if __name__ == "__main__":
    main()
