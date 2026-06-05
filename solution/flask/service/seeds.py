"""Seed-table builders for the N-dimensional IPF pipeline.

A "seed" is the initial N-D contingency table that IPF reweights to
match the supplied 1-D marginals. IPF preserves the *ratios* between
seed cells (it finds the table closest in KL divergence to the seed,
subject to the marginal constraints), so the choice of seed encodes the
prior assumptions about the joint distribution.

Five builders are provided:

- :func:`seed_noise` — uniform random noise. Adds spurious structure
  from the RNG; mainly useful for stress-testing.
- :func:`seed_uniform` — all-ones table. Yields the maximum-entropy
  (independence) fit and is the standard IPF default.
- :func:`seed_independence` — explicit outer product of the 1-D
  marginals. Mathematically equivalent to :func:`seed_uniform` after
  one IPF sweep, but converges faster.
- :func:`seed_llm_pairwise` — independence prior multiplied by
  hand-authored pairwise association factors (LLM-derived plausibility
  priors loaded from ``seed_priors.json``). Encodes interactions
  between variable pairs while leaving the marginals to IPF.
- :func:`seed_llm_full` — a pre-materialised full-joint weight tensor
  loaded from ``seed_llm_full.json``. Encodes higher-order structure
  that pairwise factors alone cannot express. When the requested dims
  are a subset of the file's dims, the loader marginalises over the
  missing axes.

All builders accept ``(marginals, rng, *, dims=None)`` and return a
``numpy.ndarray`` of shape ``tuple(len(m) for m in marginals)``. They
are selected by name via :func:`get_seed_builder`.
"""

from __future__ import annotations

import json
import random
from functools import reduce
from operator import mul
from pathlib import Path
from typing import Callable, Dict, Mapping, Sequence

import numpy as np

Marginal = Dict[str, float]
SeedBuilder = Callable[..., np.ndarray]

_PRIORS_PATH = Path(__file__).resolve().parent / "seed_priors.json"
_FULL_SEED_PATH = Path(__file__).resolve().parent / "seed_llm_full.json"


def seed_noise(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
    *,
    dims: Sequence[str] | None = None,
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
    *,
    dims: Sequence[str] | None = None,
) -> np.ndarray:
    """All-ones table — the maximum-entropy (independence) prior."""
    shape = tuple(len(m) for m in marginals)
    return np.ones(shape, dtype=float)


def seed_independence(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
    *,
    dims: Sequence[str] | None = None,
) -> np.ndarray:
    """Outer product of the 1-D marginals (explicit independence prior)."""
    vectors = [np.array(list(m.values()), dtype=float) for m in marginals]
    table = vectors[0]
    for v in vectors[1:]:
        table = np.multiply.outer(table, v)
    return table


def _load_priors() -> dict:
    with _PRIORS_PATH.open() as fh:
        return json.load(fh)


def _pair_factor_matrix(
    priors: Mapping,
    dim_a: str,
    cats_a: Sequence[str],
    dim_b: str,
    cats_b: Sequence[str],
) -> np.ndarray:
    """Return a ``(len(cats_a), len(cats_b))`` factor matrix.

    Lookup is order-insensitive: the priors file stores each pair under
    its alphabetically sorted key, so we transpose when needed. Missing
    pairs or missing category combinations default to ``1.0`` (no
    association).
    """
    key = "|".join(sorted([dim_a, dim_b]))
    pair = priors.get("pairs", {}).get(key)
    if pair is None:
        return np.ones((len(cats_a), len(cats_b)), dtype=float)

    outer_key = next(iter(pair))
    outer_is_a = outer_key in cats_a
    mat = np.ones((len(cats_a), len(cats_b)), dtype=float)
    for i, ca in enumerate(cats_a):
        for j, cb in enumerate(cats_b):
            f = pair.get(ca, {}).get(cb) if outer_is_a else pair.get(cb, {}).get(ca)
            if f is not None:
                mat[i, j] = float(f)
    return mat


def seed_llm_pairwise(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
    *,
    dims: Sequence[str] | None = None,
) -> np.ndarray:
    """Independence prior multiplied by hand-authored pairwise factors.

    For each unordered dimension pair, looks up a ``(cats_a, cats_b)``
    factor matrix from ``seed_priors.json`` and multiplies it into the
    table broadcast across all other axes. Missing pairs default to
    independence (factor 1.0), so the builder degrades gracefully when
    the priors file does not cover every requested dimension.
    """
    if dims is None:
        raise ValueError("seed_llm_pairwise requires dim names")
    if len(dims) != len(marginals):
        raise ValueError("dims and marginals length mismatch")

    priors = _load_priors()
    categories = [list(m.keys()) for m in marginals]
    table = seed_independence(marginals)
    ndim = table.ndim

    for i in range(ndim):
        for j in range(i + 1, ndim):
            mat = _pair_factor_matrix(
                priors, dims[i], categories[i], dims[j], categories[j]
            )
            shape = [1] * ndim
            shape[i] = mat.shape[0]
            shape[j] = mat.shape[1]
            table = table * mat.reshape(shape)
    return table


def _load_full_seed() -> dict:
    with _FULL_SEED_PATH.open() as fh:
        return json.load(fh)


def seed_llm_full(
    marginals: Sequence[Marginal],
    rng: random.Random | None = None,
    *,
    dims: Sequence[str] | None = None,
) -> np.ndarray:
    """Load a pre-materialised full-joint weight tensor from disk.

    The file stores weights for a fixed dimension list. When the
    requested ``dims`` are a subset, missing axes are summed out
    (marginalised) and the result is permuted/projected to match the
    requested dim and category order. Requested dims or categories that
    are not in the file raise ``ValueError``.
    """
    if dims is None:
        raise ValueError("seed_llm_full requires dim names")
    if len(dims) != len(marginals):
        raise ValueError("dims and marginals length mismatch")

    data = _load_full_seed()
    file_dims: list[str] = list(data["dims"])
    file_cats: dict[str, list[str]] = data["categories"]
    file_shape = tuple(len(file_cats[d]) for d in file_dims)

    missing = [d for d in dims if d not in file_dims]
    if missing:
        raise ValueError(
            f"seed_llm_full has no weights for dims {missing}; "
            f"available: {file_dims}"
        )

    tensor = np.zeros(file_shape, dtype=float)
    cat_index = {d: {c: i for i, c in enumerate(file_cats[d])} for d in file_dims}
    for key, value in data["weights"].items():
        parts = key.split("|")
        idx = tuple(cat_index[d][p] for d, p in zip(file_dims, parts))
        tensor[idx] = float(value)

    drop_axes = tuple(i for i, d in enumerate(file_dims) if d not in dims)
    if drop_axes:
        tensor = tensor.sum(axis=drop_axes)
    kept_dims = [d for d in file_dims if d in dims]

    perm = [kept_dims.index(d) for d in dims]
    tensor = tensor.transpose(perm)

    for axis, d in enumerate(dims):
        req_cats = list(marginals[axis].keys())
        unknown = [c for c in req_cats if c not in cat_index[d]]
        if unknown:
            raise ValueError(
                f"seed_llm_full has no weights for {d} categories {unknown}"
            )
        file_order = file_cats[d]
        take_idx = [file_order.index(c) for c in req_cats]
        tensor = np.take(tensor, take_idx, axis=axis)

    return tensor


_BUILDERS: Dict[str, SeedBuilder] = {
    "noise": seed_noise,
    "uniform": seed_uniform,
    "independence": seed_independence,
    "llm_pairwise": seed_llm_pairwise,
    "llm_full": seed_llm_full,
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
    *,
    dims: Sequence[str] | None = None,
) -> np.ndarray:
    """Convenience wrapper: resolve ``name`` and build the seed table."""
    return get_seed_builder(name)(marginals, rng, dims=dims)
