# Quality report

## 1. Coverage
- **Region(s):** buurt `BU01931000`
- **Number of synthetic individuals:** 1872
- **Number of synthetic households:** n/a (not modelled in current generator)
- **Random seed:** None
- **Generator version / git commit:** `unknown`

## 2. Variable coverage
| Variable | Priority | Present? | Source table |
|---|---|---|---|
| n/a | n/a | n/a | variables.yaml not found |

## 3. Marginal fit (must-have variables)
| Variable | Metric | Value | Threshold |
|---|---|---|---|
| leeftijd | MAPE | 20.45% | < 5% |
| leeftijd | Total Absolute Error / Total Population | 21.18% | lower is better |
| leeftijd | Chi-square | 107.618 (dof=4) | p > 0.05 |
| huishoudgrootte | MAPE | 16.80% | < 5% |
| huishoudgrootte | Total Absolute Error / Total Population | 13.80% | lower is better |
| huishoudgrootte | Chi-square | 33.010 (dof=2) | p > 0.05 |

## 4. Cross-domain consistency (S1)
| Cross\-tab | KL\(P\|\|Q\) | Jensen\-Shannon | Chi\-square |
|---|---:|---:|---:|
| achtergrond × arbeidsmarktpositie | 0.0000 | 0.0000 | 0.000 |
| achtergrond × huishoudgrootte | 0.0000 | 0.0000 | 0.000 |
| achtergrond × leeftijd | 0.0000 | 0.0000 | 0.000 |

## 5. Spatial coherence (S2)
- Spatial coherence not computed: provide `--spatial-json` with neighbour records.

## 6. Wastewater linkage (S4, only if Layer 2 is included)
- Layer 2 input not provided; wastewater linkage marked n/a.

## 7. Privacy measures (mandatory)
- Quasi-identifier set: buurtcode, leeftijd, huishoudgrootte
- Minimum cell count / k achieved: 9
- Coordinate granularity and jitter rule: n/a (no coordinates in generated output).
- Suppressed cells (<5): 0

## 8. Reproducibility
- Single command to reproduce: `python3 synthesiser.py ...`
- Approximate run time: 0.000 seconds
- Peak memory usage (Python): 0.00 MB
- Source data provenance: inferred from supplied source macro JSON and local repository files.

## 9. Known limitations
- No RWZI/catchment input supplied; section 6 is not scored.
- No multi-buurt neighbour dataset supplied; spatial coherence is not scored.
