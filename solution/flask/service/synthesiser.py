"""Synthesiser entrypoint invoked by the Spring service.

Reads macro-data JSON from `argv[1]` (the document produced by
`Service.getMacroData`), runs an IPF pipeline to fit a contingency
table to the local marginals, then samples a synthetic population from
that table. The result is printed to stdout as a single JSON object,
which the Java side captures via `callPythonSynthesiser`.

A `mode` flag selects between the legacy 2-D pipeline (`ipf_pipeline`)
and the N-dimensional one (`ipf_pipeline_nd`). The mode can be passed
as a second CLI argument (`2d` or `nd`); it defaults to `nd`.
"""

from __future__ import annotations

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generation_pipeline import (  # noqa: E402
    run_generation_nd,
    summarise_population_nd,
)
from ipf_pipeline import (  # noqa: E402
    DEFAULT_COL_DIM,
    DEFAULT_ROW_DIM,
    run_pipeline as run_ipf_2d,
)
from ipf_pipeline_nd import run_pipeline_nd as run_ipf_nd  # noqa: E402
from quality_report import (  # noqa: E402
    _mean_abs_percentage_error,
    _total_abs_error_over_total,
    _chi_square,
    _kl_divergence,
    _js_divergence,
    _project_root,
    generate_quality_report,
)
from seeds import DEFAULT_SEED_TYPE  # noqa: E402



DEFAULT_MODE = "nd"

_OUTPUT_DIR = Path(__file__).resolve().parent / "output"


def _save_population_csv(population: list[dict], buurt: str, mode: str) -> Path:
    """Write *population* to a timestamped CSV file and return its path."""
    _OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    path = _OUTPUT_DIR / f"{buurt}_{mode}_{timestamp}.csv"
    if population:
        fieldnames = list(population[0].keys())
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(population)
    return path


def _synthesise_2d(
        macro: dict,
        area: dict,
        buurt: str,
        *,
        n: int | None,
        seed: int | None,
        row_dim: str,
        col_dim: str,
) -> dict:
    ipf_result = run_ipf_2d(buurt, macro, row_dim, col_dim, seed=seed)
    dims = [row_dim, col_dim]
    gen_result = run_generation_nd(
        ipf_result["fitted_table"],
        dims,
        n=n,
        reference_marginal=ipf_result["row_marginal"],
        seed=seed,
    )
    counts = summarise_population_nd(gen_result["population"], dims)
    csv_path = _save_population_csv(gen_result["population"], buurt, "2d")

    return {
        "status": "success",
        "mode": "2d",
        "csv_path": str(csv_path),
        "area": area,
        "dims": dims,
        "n": gen_result["n"],
        "seed": seed,
        "residuals": ipf_result["residuals"],
        "fitted_table": {f"{r}|{c}": v for (r, c), v in ipf_result["fitted_table"].items()},
        "cell_counts": {"|".join(k): v for k, v in counts.items()},
        "population": gen_result["population"],
    }


def _synthesise_nd(
        macro: dict,
        area: dict,
        buurt: str,
        *,
        n: int | None,
        seed: int | None,
        dims: list[str] | None,
        ipf_seed_type: str,
) -> dict:
    ipf_result = run_ipf_nd(
        buurt, macro, dims=dims, seed=seed, ipf_seed_type=ipf_seed_type
    )
    used_dims = ipf_result["dims"]
    reference_marginal = ipf_result["marginals"][used_dims[0]]

    gen_result = run_generation_nd(
        ipf_result["fitted_table"],
        used_dims,
        n=n,
        reference_marginal=reference_marginal,
        seed=seed,
    )
    csv_path = _save_population_csv(gen_result["population"], buurt, "nd")

    counts = summarise_population_nd(gen_result["population"], used_dims)
    gen_quality_report = {
        "mean_abs_percentage_error": _mean_abs_percentage_error(
            ipf_result["fitted_table"], counts
        ),
        "total_abs_error_over_total": _total_abs_error_over_total(
            ipf_result["fitted_table"], counts
        ),
        "chi_square": _chi_square(ipf_result["fitted_table"], counts),
        "kl_divergence": _kl_divergence(ipf_result["fitted_table"], counts),
        "js_divergence": _js_divergence(ipf_result["fitted_table"], counts),
    }

    row_dim = used_dims[0]
    col_dim = used_dims[1] if len(used_dims) > 1 else used_dims[0]

    result = {
        "status": "success",
        "mode": "nd",
        "area": area,
        "dims": used_dims,
        "n": gen_result["n"],
        "seed": seed,
        "ipf_seed_type": ipf_seed_type,
        "residuals": ipf_result["residuals"],
        "fitted_table": {"|".join(k): v for k, v in ipf_result["fitted_table"].items()},
        "cell_counts": {"|".join(k): v for k, v in counts.items()},
        "population": gen_result["population"],
        "quality_report": gen_quality_report,
        "csv_path": str(csv_path),
    }

    here = Path(__file__).resolve().parent
    report_path = generate_quality_report(
        result,
        out_md=here / "quality-report.md",
        out_dir=here / "quality-report-artifacts",
        variables_yaml=_project_root() / "data" / "variables.yaml",
        source_macro=macro,
    )
    result["quality_report_path"] = str(report_path)

    return result


def synthesise(
        macro: dict,
        *,
        mode: str = DEFAULT_MODE,
        n: int | None = None,
        seed: int | None = None,
        row_dim: str = DEFAULT_ROW_DIM,
        col_dim: str = DEFAULT_COL_DIM,
        dims: list[str] | None = None,
        ipf_seed_type: str = DEFAULT_SEED_TYPE,
) -> dict:
    """Run IPF (2-D or N-D) then sample a synthetic population.

    `mode` is `"2d"` for the legacy 2-D pipeline or `"nd"` for the
    N-dimensional one. In `nd` mode, `dims` defaults to all marginals
    present in `macro['marginals']` and `ipf_seed_type` selects the
    initial seed builder from :mod:`seeds` (e.g. `"noise"`,
    `"uniform"`, `"independence"`).
    """
    area = macro.get("area", {}) or {}
    buurt = area.get("code", "UNKNOWN")

    if mode == "2d":
        return _synthesise_2d(
            macro, area, buurt, n=n, seed=seed, row_dim=row_dim, col_dim=col_dim
        )
    if mode == "nd":
        return _synthesise_nd(
            macro, area, buurt, n=n, seed=seed, dims=dims, ipf_seed_type=ipf_seed_type
        )
    raise ValueError(f"unknown mode '{mode}'; expected '2d' or 'nd'")


def main() -> None:
    if len(sys.argv) <= 1:
        print(json.dumps({"status": "error", "message": "no macro JSON provided"}))
        return

    mode = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MODE
    ipf_seed_type = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_SEED_TYPE

    try:
        macro = json.loads(sys.argv[1])
        result = synthesise(macro, mode=mode, ipf_seed_type=ipf_seed_type)
    except Exception as exc:  # surface any failure to Java
        print(json.dumps({"status": "error", "message": str(exc), "mode": mode}))
        return

    print(json.dumps(result))


if __name__ == "__main__":
    main()
