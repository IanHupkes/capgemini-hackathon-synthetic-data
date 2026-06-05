# Quality report

## 1. Coverage
- **Region(s):** buurt `GM0050`
- **Number of synthetic individuals:** 17963
- **Number of synthetic households:** n/a (not modelled in current generator)
- **Random seed:** None
- **Generator version / git commit:** `facc187`

## 2. Variable coverage
| Variable | Priority | Present? | Source table |
|---|---|---|---|
| Buurtcode / wijkcode (BU/WK) (`buurtcode`) | must-have | ✅ | 86165NED |
| Bevolkingsomvang per buurt (`bevolkingsomvang-buurt`) | must-have | ✅ | 86165NED |
| Leeftijdsverdeling (0-14 / 15-24 / 25-44 / 45-64 / 65+) (`leeftijdsverdeling`) | must-have | ✅ | 86165NED |
| Huishoudgrootte en -samenstelling (`huishoudgrootte-samenstelling`) | must-have | ✅ | 86165NED |
| Aandeel niet-westerse achtergrond (`aandeel-niet-westerse-achtergrond`) | must-have | ❌ | 86165NED |
| Woningtype (appartement / rijtjeshuis / vrijstaand) (`woningtype`) | must-have | ❌ | 86165NED |
| Bezettingsgraad woning (personen per woning) (`bezettingsgraad-woning`) | must-have | ❌ | 86165NED |
| Gemiddeld besteedbaar inkomen per huishouden (`besteedbaar-inkomen-huishouden`) | must-have | ❌ | 86165NED |
| Stedelijkheidsgraad / urban-rural classificatie (`stedelijkheidsgraad`) | must-have | ❌ | 86165NED |
| Opleidingsniveau (laag / midden / hoog, % bevolking 25+) (`opleidingsniveau`) | must-have | ❌ | 82275NED |
| RWZI-ID, naam, locatie, capaciteit (`rwzi-register`) | must-have | ❌ | rwzi-register |
| Catchment-oppervlak en aansluitingen (`rwzi-catchment`) | must-have | ❌ | pdok-gwsw-beheergebied |
| Landgebruik - aandeel woongebied (% oppervlak) (`landgebruik-woongebied`) | must-have | ❌ | 70262NED |
| Landgebruik - aandeel industrie / bedrijventerrein (%) (`landgebruik-industrie`) | must-have | ❌ | 70262NED |
| Landgebruik - aandeel agrarisch (%) (`landgebruik-agrarisch`) | must-have | ❌ | 70262NED |
| Nabijheid (lucht)haven (km tot dichtstbijzijnde) (`nabijheid-luchthaven`) | must-have | ❌ | 85870NED |
| Arbeidsmarktpositie (% werkend / werkloos / arbeidsongeschikt) (`arbeidsmarktpositie`) | should-have | ❌ | 86165NED |
| Uitkeringsontvangers (bijstand / WW / WAO, n en %) (`uitkeringsontvangers`) | should-have | ❌ | 86165NED |
| WMO-gebruik (% met maatwerkvoorziening) (`wmo-gebruik`) | should-have | ❌ | 86165NED |
| Jeugdzorggebruik (% 0-17 jaar) (`jeugdzorggebruik`) | should-have | ❌ | 86165NED |
| Arbeidssector (zorg / onderwijs / industrie / diensten, %) (`arbeidssector`) | should-have | ❌ | 82309NED |
| Landgebruik - aandeel groen / natuur (%) (`landgebruik-groen`) | should-have | ❌ | 70262NED |
| Landgebruik - aandeel water / waterwegen (%) (`landgebruik-water`) | should-have | ❌ | 70262NED |
| Schoolgaande kinderen per buurt (% 4-17 jaar) (`schoolgaande-kinderen`) | should-have | ❌ | 86165NED |
| Dagelijkse mobiliteit - woon-werkafstand (gem. km, % forensen) (`mobiliteit-woon-werk`) | should-have | ❌ | 84709NED |
| Autobezit per huishouden (`autobezit`) | could-have | ❌ | 86165NED |
| Nabijheid ziekenhuis / SEH (km) (`nabijheid-ziekenhuis`) | could-have | ❌ | 85870NED |
| Nabijheid verpleeghuis / verzorgingstehuis (km) (`nabijheid-verpleeghuis`) | could-have | ❌ | 85870NED |
| Instellingstype in catchment (school / ziekenhuis) (`instellingstype-catchment`) | could-have | ❌ | 85870NED |
| Toeristische overnachtingen per jaar (n) (`toeristische-overnachtingen`) | would-have | ❌ | 82059NED |

## 3. Marginal fit (must-have variables)
| Variable | Metric | Value | Threshold |
|---|---|---|---|
| leeftijd | MAPE | 26.16% | < 5% |
| leeftijd | Total Absolute Error / Total Population | 26.05% | lower is better |
| leeftijd | Chi-square | 1649.324 (dof=4) | p > 0.05 |
| huishoudgrootte | MAPE | 70.83% | < 5% |
| huishoudgrootte | Total Absolute Error / Total Population | 70.86% | lower is better |
| huishoudgrootte | Chi-square | 5282.437 (dof=2) | p > 0.05 |

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
- Minimum cell count / k achieved: 665
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
