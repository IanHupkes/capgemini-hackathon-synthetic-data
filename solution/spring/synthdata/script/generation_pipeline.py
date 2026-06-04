"""Generation pipeline: sample a synthetic population from a fitted table.

Takes the `fitted_table` produced by an IPF pipeline (a contingency
table keyed by a tuple of category values, one per dimension) and draws
independent synthetic individuals by treating the table as a joint
probability distribution over those attributes.
"""

from __future__ import annotations

import random
from typing import Dict, Iterable, List, Mapping, Tuple

NDCell = Tuple[str, ...]
NDTable = Dict[NDCell, float]


def population_size_from_marginal(marginal: Mapping[str, float]) -> int:
    """Round the sum of a marginal to an integer population size."""
    return int(round(sum(marginal.values())))


def _nd_table_to_distribution(table: NDTable) -> tuple[list[NDCell], list[float]]:
    cells = list(table.keys())
    weights = [max(float(table[c]), 0.0) for c in cells]
    total = sum(weights)
    if total <= 0:
        raise ValueError("fitted N-D table has non-positive total mass; cannot sample")
    return cells, weights


def sample_population_nd(
    table: NDTable,
    n: int,
    dims: Iterable[str],
    *,
    rng: random.Random | None = None,
) -> List[Dict[str, str]]:
    """Draw `n` synthetic individuals from a joint distribution over N dims."""
    r = rng or random.Random()
    dims = list(dims)
    cells, weights = _nd_table_to_distribution(table)
    draws = r.choices(cells, weights=weights, k=n)
    return [dict(zip(dims, cell)) for cell in draws]


def run_generation_nd(
    fitted_table: NDTable,
    dims: Iterable[str],
    *,
    n: int | None = None,
    reference_marginal: Mapping[str, float] | None = None,
    seed: int | None = None,
) -> dict:
    """Generate a synthetic population from a fitted N-D IPF table."""
    dims = list(dims)
    if n is None:
        if reference_marginal is None:
            raise ValueError("either `n` or `reference_marginal` must be provided")
        n = population_size_from_marginal(reference_marginal)

    rng = random.Random(seed)
    individuals = sample_population_nd(fitted_table, n, dims, rng=rng)

    return {
        "dims": dims,
        "n": n,
        "seed": seed,
        "population": individuals,
    }


def summarise_population_nd(
    population: Iterable[Mapping[str, str]],
    dims: Iterable[str],
) -> Dict[NDCell, int]:
    """Count synthetic individuals per N-D cell."""
    dims = list(dims)
    counts: Dict[NDCell, int] = {}
    for person in population:
        key = tuple(person[d] for d in dims)
        counts[key] = counts.get(key, 0) + 1
    return counts
