"""N-dimensional IPF pipeline with a pluggable seed builder.

Generalises :mod:`ipf_pipeline` from a fixed 2-D (row x col) contingency
table to an N-dimensional table over an arbitrary list of dimensions.
Each dimension contributes a 1-D marginal extracted from the macro-data
document (same shape as `Service.getMacroData` on the Spring side):

    {
      "marginals": {
        "leeftijd":        {"0-14": 105, ...},
        "huishoudgrootte": {"1": 245, ...},
        "woningtype":      {"appartement": 280, ...},
        ...
      }
    }

The pipeline supports 3+ dimensions and scales dynamically: pass any
list of dimension names present in `macro['marginals']`.
"""

from __future__ import annotations

import json
import random
from itertools import product
from typing import Dict, List, Mapping, Sequence, Tuple

import numpy as np

from seeds import DEFAULT_SEED_TYPE, build_seed

Marginal = Dict[str, float]


def extract_marginal(macro: Mapping, dim: str) -> Marginal:
    """Pull a single named 1-D marginal out of the macro-data mapping."""
    try:
        raw = macro["marginals"][dim]
    except KeyError as exc:
        raise KeyError(f"marginal '{dim}' not present in macro data") from exc
    return {str(k): float(v) for k, v in raw.items()}


def _rescale_to_total(marginals: Sequence[Marginal]) -> List[Marginal]:
    """Rescale every marginal to the mean of all marginal totals.

    IPF requires every 1-D marginal to sum to the same grand total.
    Macro data is usually already consistent, but small rounding drift
    is common; this nudges each marginal so they agree.
    """
    totals = [sum(m.values()) for m in marginals]
    target = sum(totals) / len(totals)
    rescaled: List[Marginal] = []
    for m, t in zip(marginals, totals):
        if t == 0:
            raise ValueError("marginal sums to zero; cannot rescale")
        factor = target / t
        rescaled.append({k: v * factor for k, v in m.items()})
    return rescaled


def ipf_nd(
    seed: np.ndarray,
    marginals: Sequence[Marginal],
    n_iter: int = 100,
    tol: float = 1e-6,
) -> np.ndarray:
    """Fit an N-D contingency table to a list of 1-D marginals.

    `marginals[i]` is the target marginal along axis `i`; its category
    order must match the axis order of `seed`.
    """
    if seed.ndim != len(marginals):
        raise ValueError(
            f"seed has {seed.ndim} dims but {len(marginals)} marginals were given"
        )
    targets = [np.array(list(m.values()), dtype=float) for m in marginals]
    for axis, (target, m) in enumerate(zip(targets, marginals)):
        if seed.shape[axis] != target.size:
            raise ValueError(
                f"axis {axis} ('{len(m)}' cats) does not match seed shape {seed.shape}"
            )

    table = seed.astype(float, copy=True)
    ndim = table.ndim
    all_axes = tuple(range(ndim))

    for _ in range(n_iter):
        for axis, target in enumerate(targets):
            other_axes = tuple(a for a in all_axes if a != axis)
            current = table.sum(axis=other_axes)
            with np.errstate(divide="ignore", invalid="ignore"):
                factor = np.where(current > 0, target / current, 0.0)
            shape = [1] * ndim
            shape[axis] = table.shape[axis]
            table *= factor.reshape(shape)

        err = max(
            float(np.max(np.abs(table.sum(axis=tuple(a for a in all_axes if a != axis)) - target)))
            for axis, target in enumerate(targets)
        )
        if err < tol:
            break

    return table


def marginal_residuals_nd(
    table: np.ndarray, marginals: Sequence[Marginal]
) -> dict[str, float]:
    """Max absolute deviation of fitted table from each target marginal."""
    ndim = table.ndim
    all_axes = tuple(range(ndim))
    out: dict[str, float] = {}
    for axis, m in enumerate(marginals):
        target = np.array(list(m.values()), dtype=float)
        other = tuple(a for a in all_axes if a != axis)
        err = float(np.max(np.abs(table.sum(axis=other) - target)))
        out[f"axis{axis}_max_abs_err"] = err
    return out


def table_to_cells(
    table: np.ndarray, dims: Sequence[str], marginals: Sequence[Marginal]
) -> Dict[Tuple[str, ...], float]:
    """Convert an N-D numpy table into a `{(cat_dim0, cat_dim1, ...): value}` dict."""
    categories = [list(m.keys()) for m in marginals]
    cells: Dict[Tuple[str, ...], float] = {}
    for idx in product(*(range(len(c)) for c in categories)):
        key = tuple(categories[d][i] for d, i in enumerate(idx))
        cells[key] = float(table[idx])
    return cells


def run_pipeline_nd(
    buurt: str,
    macro: Mapping | str,
    dims: Sequence[str] | None = None,
    *,
    seed: int | None = None,
    ipf_seed_type: str = DEFAULT_SEED_TYPE,
    n_iter: int = 100,
    tol: float = 1e-6,
) -> dict:
    """Run the N-D IPF pipeline for a single buurt.

    `dims` is the ordered list of dimension names to fit jointly; each
    must be a key in `macro['marginals']`. When omitted, every key in
    `macro['marginals']` is used. `ipf_seed_type` selects the initial
    seed builder from :mod:`seeds`.
    """
    if isinstance(macro, str):
        macro = json.loads(macro)
    if dims is None:
        dims = tuple(macro["marginals"].keys())
    if len(dims) < 2:
        raise ValueError("need at least 2 dimensions for IPF")

    raw_marginals = [extract_marginal(macro, d) for d in dims]
    marginals = _rescale_to_total(raw_marginals)
    shape = tuple(len(m) for m in marginals)

    rng = random.Random(seed)
    initial = build_seed(ipf_seed_type, marginals, rng)
    fitted = ipf_nd(initial, marginals, n_iter=n_iter, tol=tol)
    residuals = marginal_residuals_nd(fitted, marginals)

    return {
        "buurt": buurt,
        "dims": list(dims),
        "seed": seed,
        "ipf_seed_type": ipf_seed_type,
        "shape": shape,
        "marginals": {d: m for d, m in zip(dims, marginals)},
        "initial_seed_table": table_to_cells(initial, dims, marginals),
        "fitted_table": table_to_cells(fitted, dims, marginals),
        "residuals": residuals,
    }


def _stringify_keys(cells: Mapping[Tuple[str, ...], float]) -> dict[str, float]:
    return {"|".join(k): v for k, v in cells.items()}


if __name__ == "__main__":
    from ipf_pipeline import EXAMPLE_MACRO_JSON

    result = run_pipeline_nd(
        "BU001",
        EXAMPLE_MACRO_JSON,
        seed=42,
    )
    print("dims:", result["dims"])
    print("shape:", result["shape"])
    print("residuals:", result["residuals"])
    print("non-zero cells:", sum(1 for v in result["fitted_table"].values() if v > 1e-9))
