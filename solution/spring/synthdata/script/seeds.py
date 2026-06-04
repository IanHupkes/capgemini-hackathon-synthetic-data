"""Seed-table builders for the N-dimensional IPF pipeline.

A "seed" is the initial N-D contingency table that IPF reweights to
match the supplied 1-D marginals. IPF preserves the *ratios* between
seed cells (it finds the table closest in KL divergence to the seed,
subject to the marginal constraints), so the choice of seed encodes the
prior assumptions about the joint distribution.

Three builders are provided:

- :func:`seed_noise` — uniform random noise. Adds spurious structure
  from the RNG; mainly useful for stress-testing.
- :func:`seed_uniform` — all-ones table. Yields the maximum-entropy
  (independence) fit and is the standard IPF default.
- :func:`seed_independence` — explicit outer product of the 1-D
  marginals. Mathematically equivalent to :func:`seed_uniform` after
  one IPF sweep, but converges faster.

All builders return a ``numpy.ndarray`` of shape ``tuple(len(m) for m
in marginals)`` (or the explicit ``shape`` for noise/uniform). They are
selected by name via :func:`get_seed_builder`.
"""

from __future__ import annotations

import random
from functools import reduce
from operator import mul
from typing import Callable, Dict, Mapping, Sequence

import numpy as np

Marginal = Dict[str, float]
SeedBuilder = Callable[[Sequence[Marginal], random.Random | None], np.ndarray]


def seed_noise(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
    *,
    low: float = 1.0,
    high: float = 100.0,
) -> np.ndarray:
    """Uniform random noise in ``[low, high)`` for every cell."""
    shape = tuple(len(m) for m in marginals)
    r = rng or random.Random()
    size = reduce(mul, shape, 1)
    flat = [r.uniform(low, high) for _ in range(size)]
    return np.array(flat, dtype=float).reshape(shape)


def seed_uniform(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
) -> np.ndarray:
    """All-ones table — the maximum-entropy (independence) prior."""
    shape = tuple(len(m) for m in marginals)
    return np.ones(shape, dtype=float)


def seed_independence(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
) -> np.ndarray:
    """Outer product of the 1-D marginals (explicit independence prior)."""
    vectors = [np.array(list(m.values()), dtype=float) for m in marginals]
    table = vectors[0]
    for v in vectors[1:]:
        table = np.multiply.outer(table, v)
    return table


_BUILDERS: Dict[str, SeedBuilder] = {
    "noise": seed_noise,
    "uniform": seed_uniform,
    "independence": seed_independence,
}

DEFAULT_SEED_TYPE = "independence"


def available_seed_types() -> list[str]:
    return list(_BUILDERS.keys())


def get_seed_builder(name: str) -> SeedBuilder:
    """Look up a seed builder by name. Raises ``ValueError`` if unknown."""
    try:
        return _BUILDERS[name]
    except KeyError as exc:
        raise ValueError(
            f"unknown ipf_seed_type '{name}'; expected one of {available_seed_types()}"
        ) from exc


def build_seed(
    name: str,
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
) -> np.ndarray:
    """Convenience wrapper: resolve ``name`` and build the seed table."""
    return get_seed_builder(name)(marginals, rng)
