"""Generation pipeline: sample a synthetic population from a fitted table.

Takes the `fitted_table` produced by :mod:`solution.pipeline.ipf_pipeline`
(a 2-D contingency table keyed by ``(row_category, col_category)``) and
draws independent synthetic individuals by treating the table as a joint
probability distribution over the two attributes.
"""

from __future__ import annotations

import random
from typing import Dict, Iterable, List, Mapping, Tuple

Cell = Tuple[str, str]
Table = Dict[Cell, float]


def _table_to_distribution(table: Table) -> tuple[list[Cell], list[float]]:
    cells = list(table.keys())
    weights = [max(float(table[c]), 0.0) for c in cells]
    total = sum(weights)
    if total <= 0:
        raise ValueError("fitted table has non-positive total mass; cannot sample")
    return cells, weights


def sample_population(
    table: Table,
    n: int,
    row_dim: str,
    col_dim: str,
    *,
    rng: random.Random | None = None,
) -> List[Dict[str, str]]:
    """Draw `n` synthetic individuals from the joint distribution in `table`.

    Each individual is a dict with two keys (`row_dim`, `col_dim`) holding
    the sampled category values.
    """
    r = rng or random.Random()
    cells, weights = _table_to_distribution(table)
    draws = r.choices(cells, weights=weights, k=n)
    return [{row_dim: row, col_dim: col} for row, col in draws]


def population_size_from_marginal(marginal: Mapping[str, float]) -> int:
    """Round the sum of a marginal to an integer population size."""
    return int(round(sum(marginal.values())))


def run_generation(
    fitted_table: Table,
    row_dim: str,
    col_dim: str,
    *,
    n: int | None = None,
    row_marginal: Mapping[str, float] | None = None,
    seed: int | None = None,
) -> dict:
    """Generate a synthetic population from a fitted IPF table.

    `n` overrides the population size. If omitted, it is inferred from
    `row_marginal` (sum of its values), which should match the macro-data
    population total used to fit the table.
    """
    if n is None:
        if row_marginal is None:
            raise ValueError("either `n` or `row_marginal` must be provided")
        n = population_size_from_marginal(row_marginal)

    rng = random.Random(seed)
    individuals = sample_population(fitted_table, n, row_dim, col_dim, rng=rng)

    return {
        "row_dim": row_dim,
        "col_dim": col_dim,
        "n": n,
        "seed": seed,
        "population": individuals,
    }


def summarise_population(
    population: Iterable[Mapping[str, str]],
    row_dim: str,
    col_dim: str,
) -> Dict[Cell, int]:
    """Count synthetic individuals per (row, col) cell."""
    counts: Dict[Cell, int] = {}
    for person in population:
        key = (person[row_dim], person[col_dim])
        counts[key] = counts.get(key, 0) + 1
    return counts
