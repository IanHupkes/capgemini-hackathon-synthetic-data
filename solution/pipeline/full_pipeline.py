"""Full synthetic-data pipeline entrypoint.

Chains the IPF pipeline (fits a 2-D contingency table to local marginals)
with the generation pipeline (samples a synthetic population from that
table). This is the CLI entrypoint for the end-to-end run.

Run:
    python -m solution.pipeline.full_pipeline --buurt BU03440101
"""

from __future__ import annotations

import argparse
import json
from typing import Mapping

from solution.pipeline.generation_pipeline import (
    run_generation,
    summarise_population,
)
from solution.pipeline.ipf_pipeline import (
    DEFAULT_COL_DIM,
    DEFAULT_ROW_DIM,
    EXAMPLE_MACRO_JSON,
    format_table,
    run_pipeline as run_ipf,
)


def run_full_pipeline(
    buurt: str,
    macro: Mapping | str,
    row_dim: str = DEFAULT_ROW_DIM,
    col_dim: str = DEFAULT_COL_DIM,
    *,
    n: int | None = None,
    seed: int | None = None,
) -> dict:
    """Run IPF then sample a synthetic population from the fitted table."""
    ipf_result = run_ipf(buurt, macro, row_dim, col_dim, seed=seed)
    generation_result = run_generation(
        ipf_result["fitted_table"],
        row_dim,
        col_dim,
        n=n,
        row_marginal=ipf_result["row_marginal"],
        seed=seed,
    )
    return {"ipf": ipf_result, "generation": generation_result}


def _stringify_keys(table):
    return {f"{r}|{c}": v for (r, c), v in table.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--buurt", default="BU03440101", help="Buurt code (illustrative).")
    parser.add_argument("--row-dim", default=DEFAULT_ROW_DIM)
    parser.add_argument("--col-dim", default=DEFAULT_COL_DIM)
    parser.add_argument(
        "--macro",
        help="Path to a macro-data JSON file (defaults to embedded example).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="RNG seed (omit for non-deterministic).",
    )
    parser.add_argument(
        "--n",
        type=int,
        default=None,
        help="Synthetic population size (defaults to sum of row marginal).",
    )
    parser.add_argument("--json", action="store_true", help="Emit result as JSON.")
    args = parser.parse_args()

    if args.macro:
        with open(args.macro, "r", encoding="utf-8") as fh:
            macro_json = fh.read()
    else:
        macro_json = EXAMPLE_MACRO_JSON

    result = run_full_pipeline(
        args.buurt,
        macro_json,
        args.row_dim,
        args.col_dim,
        n=args.n,
        seed=args.seed,
    )
    ipf_result = result["ipf"]
    gen_result = result["generation"]

    if args.json:
        printable = {
            "ipf": {
                **ipf_result,
                "initial_seed_table": _stringify_keys(ipf_result["initial_seed_table"]),
                "fitted_table": _stringify_keys(ipf_result["fitted_table"]),
            },
            "generation": gen_result,
        }
        print(json.dumps(printable, indent=2))
        return

    print(
        f"Full pipeline for buurt {ipf_result['buurt']} "
        f"({ipf_result['row_dim']} x {ipf_result['col_dim']})"
    )
    print("\nFitted table:")
    print(format_table(
        ipf_result["fitted_table"],
        ipf_result["row_marginal"],
        ipf_result["col_marginal"],
    ))
    print("\nResiduals:")
    for k, v in ipf_result["residuals"].items():
        print(f"  {k}: {v:.2e}")

    print(f"\nSynthetic population: {gen_result['n']} individuals")
    counts = summarise_population(
        gen_result["population"], ipf_result["row_dim"], ipf_result["col_dim"]
    )
    print("Sampled cell counts:")
    for (r, c), v in sorted(counts.items()):
        print(f"  {r:<8} {c:<14} {v}")


# TODO: build an evaluation pipeline that runs all the required evaluation methods from /docs/kwaliteitsrapport-template.md
# TODO: chain the evaluation pipeline into `run_full_pipeline` and return its results alongside the synthetic population.

if __name__ == "__main__":
    main()
