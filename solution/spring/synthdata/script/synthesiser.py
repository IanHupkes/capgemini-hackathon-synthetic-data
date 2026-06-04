"""Synthesiser entrypoint invoked by the Spring service.

Reads macro-data JSON from `argv[1]` (the document produced by
`Service.getMacroData`), runs the IPF pipeline to fit a 2-D contingency
table to the local marginals, then samples a synthetic population from
that table. The result is printed to stdout as a single JSON object,
which the Java side captures via `callPythonSynthesiser`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generation_pipeline import run_generation, summarise_population  # noqa: E402
from ipf_pipeline import (  # noqa: E402
    DEFAULT_COL_DIM,
    DEFAULT_ROW_DIM,
    run_pipeline as run_ipf,
)


def synthesise(
    macro: dict,
    row_dim: str = DEFAULT_ROW_DIM,
    col_dim: str = DEFAULT_COL_DIM,
    *,
    n: int | None = None,
    seed: int | None = None,
) -> dict:
    """Run IPF then sample a synthetic population from the fitted table."""
    area = macro.get("area", {}) or {}
    buurt = area.get("code", "UNKNOWN")

    ipf_result = run_ipf(buurt, macro, row_dim, col_dim, seed=seed)
    gen_result = run_generation(
        ipf_result["fitted_table"],
        row_dim,
        col_dim,
        n=n,
        row_marginal=ipf_result["row_marginal"],
        seed=seed,
    )

    counts = summarise_population(gen_result["population"], row_dim, col_dim)

    return {
        "status": "success",
        "area": area,
        "row_dim": row_dim,
        "col_dim": col_dim,
        "n": gen_result["n"],
        "seed": seed,
        "residuals": ipf_result["residuals"],
        "fitted_table": {f"{r}|{c}": v for (r, c), v in ipf_result["fitted_table"].items()},
        "cell_counts": {f"{r}|{c}": v for (r, c), v in counts.items()},
        "population": gen_result["population"],
    }


def main() -> None:
    if len(sys.argv) <= 1:
        print(json.dumps({"status": "error", "message": "no macro JSON provided"}))
        return

    try:
        macro = json.loads(sys.argv[1])
        result = synthesise(macro)
    except Exception as exc:  # surface any failure to Java
        print(json.dumps({"status": "error", "message": str(exc)}))
        return

    print(json.dumps(result))


if __name__ == "__main__":
    main()
