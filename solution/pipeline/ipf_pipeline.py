"""IPF pipeline with a random-noise seed.

Fits a 2-D contingency table to local CBS-style marginals using
Iterative Proportional Fitting (IPF). The seed table is generated from
random noise.

Marginals are extracted from a macro-data JSON document shaped like the
one produced by the Spring service (`Service.getMacroData`): a
`marginals` object whose keys are dimensions (e.g. `leeftijd`,
`huishoudgrootte`) and whose values are mappings from category to count.

The CLI entrypoint lives in :mod:`solution.pipeline.full_pipeline`.
"""

from __future__ import annotations

import json
import random
from typing import Dict, Iterable, Mapping, Tuple

Cell = Tuple[str, str]
Table = Dict[Cell, float]
Marginal = Dict[str, float]


DEFAULT_ROW_DIM = "leeftijd"
DEFAULT_COL_DIM = "huishoudgrootte"

# Example macro JSON mirroring `Service.getMacroData` on the Spring side.
EXAMPLE_MACRO_JSON = """
{
  "area": {"type": "buurt", "code": "BU001", "name": "Voorbeeldbuurt"},
  "population": 700,
  "marginals": {
    "leeftijd":            {"0-14": 105, "15-24": 98, "25-44": 210, "45-64": 182, "65+": 105},
    "huishoudgrootte":     {"1": 245, "2": 280, "3+": 175},
    "woningtype":          {"appartement": 280, "rijtjeshuis": 315, "vrijstaand": 105},
    "opleidingsniveau":    {"laag": 210, "midden": 315, "hoog": 175},
    "arbeidsmarktpositie": {"werkend": 420, "werkloos": 56, "arbeidsongeschikt": 224},
    "achtergrond":         {"niet-westers": 140, "westers": 560}
  }
}
"""


def extract_marginal(macro: Mapping, dim: str) -> Marginal:
    """Pull a single named marginal out of the macro-data mapping."""
    try:
        raw = macro["marginals"][dim]
    except KeyError as exc:
        raise KeyError(f"marginal '{dim}' not present in macro data") from exc
    return {str(k): float(v) for k, v in raw.items()}


def seed_noise(
    rows: Iterable[str],
    cols: Iterable[str],
    *,
    low: float = 1.0,
    high: float = 100.0,
    rng: random.Random | None = None,
) -> Table:
    """Build a seed contingency table filled with uniform random noise."""
    r = rng or random.Random()
    return {(row, col): r.uniform(low, high) for row in rows for col in cols}


def ipf(
    seed: Table,
    row_marg: Marginal,
    col_marg: Marginal,
    n_iter: int = 100,
    tol: float = 1e-6,
) -> Table:
    """Fit a 2-D contingency table to given row & column marginals."""
    rows = list(row_marg)
    cols = list(col_marg)
    table: Table = {(r, c): float(seed.get((r, c), 1.0)) for r in rows for c in cols}
    for _ in range(n_iter):
        for r in rows:
            s = sum(table[(r, c)] for c in cols)
            if s == 0:
                continue
            factor = row_marg[r] / s
            for c in cols:
                table[(r, c)] *= factor
        for c in cols:
            s = sum(table[(r, c)] for r in rows)
            if s == 0:
                continue
            factor = col_marg[c] / s
            for r in rows:
                table[(r, c)] *= factor
        err = max(
            max(abs(sum(table[(r, c)] for c in cols) - row_marg[r]) for r in rows),
            max(abs(sum(table[(r, c)] for r in rows) - col_marg[c]) for c in cols),
        )
        if err < tol:
            break
    return table


def marginal_residuals(
    table: Table, row_marg: Marginal, col_marg: Marginal
) -> dict[str, float]:
    """Max absolute deviation of fitted table from target marginals."""
    rows, cols = list(row_marg), list(col_marg)
    row_err = max(abs(sum(table[(r, c)] for c in cols) - row_marg[r]) for r in rows)
    col_err = max(abs(sum(table[(r, c)] for r in rows) - col_marg[c]) for c in cols)
    return {"row_max_abs_err": row_err, "col_max_abs_err": col_err}


def format_table(table: Table, rows: Iterable[str], cols: Iterable[str]) -> str:
    cols = list(cols)
    header = f"{'age':<8}" + "".join(f"{c:>14}" for c in cols)
    lines = [header]
    for r in rows:
        cells = "".join(f"{table[(r, c)]:>14.1f}" for c in cols)
        lines.append(f"{r:<8}{cells}")
    return "\n".join(lines)


def run_pipeline(
    buurt: str,
    macro: Mapping | str,
    row_dim: str = DEFAULT_ROW_DIM,
    col_dim: str = DEFAULT_COL_DIM,
    *,
    seed: int | None = None,
) -> dict:
    """Run the noise-seeded IPF pipeline for a single buurt.

    `macro` is the macro-data document (parsed dict or JSON string) in
    the shape produced by the Spring `Service.getMacroData` endpoint.
    Row and column marginals are extracted from `macro['marginals']`
    using `row_dim` / `col_dim`. `seed` controls the RNG used to build
    the noise seed table; pass an int for reproducible runs.
    """
    if isinstance(macro, str):
        macro = json.loads(macro)

    row_marg = extract_marginal(macro, row_dim)
    col_marg = extract_marginal(macro, col_dim)

    rng = random.Random(seed)
    initial = seed_noise(row_marg.keys(), col_marg.keys(), rng=rng)
    fitted = ipf(initial, row_marg, col_marg)
    residuals = marginal_residuals(fitted, row_marg, col_marg)

    return {
        "buurt": buurt,
        "row_dim": row_dim,
        "col_dim": col_dim,
        "seed": seed,
        "row_marginal": row_marg,
        "col_marginal": col_marg,
        "initial_seed_table": initial,
        "fitted_table": fitted,
        "residuals": residuals,
    }


def _stringify_keys(table: Table) -> dict[str, float]:
    return {f"{r}|{c}": v for (r, c), v in table.items()}

