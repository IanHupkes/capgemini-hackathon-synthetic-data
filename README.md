# OneGov #2 | Synthetic Data: Pandemic Preparedness

> *From neighbourhood aggregates to a synthetic population realistic enough to model an outbreak.*

This repository hosts the challenge brief, supporting documents, a public-data variable catalogue, and starter tooling for the second **OneGov** hackathon, hosted by [GovTech NL](https://govtechnl.nl) with challenge owners **CBS**, **ODISSEI**, **Erasmus MC** and **Digicampus**.

- **Theme:** Synthetic Data
- **Date:** 4–5 June 2026
- **Location:** The Hague Tech, Den Haag
- **Challenge owner:** Marc Winsemius (Digicampus)
- **Co-owners:** Ruben Dood (CBS), Tom Emery (ODISSEI), Ted Oliekan (Erasmus MC)
- **Contact:** [hack@govtechnl.nl](mailto:hack@govtechnl.nl)

## The challenge in one paragraph

When a new infectious disease emerges, rapid insight into how a virus spreads through a population is critical. Epidemiological **infection-and-recovery models** need data at the **micro level**: synthetic persons with realistic age, household, housing, work-sector and mobility characteristics. That micro-data does not exist as an openly available file. What does exist are rich, reliable **aggregates** at *buurt* and *wijk* level from CBS and RIVM.

**How do we generate, using only publicly available data, a micro-level synthetic population that is statistically consistent with CBS neighbourhood aggregates, preserves spatial structure, and can feed both infection-and-recovery models and wastewater (RWZI) surveillance?**

The full brief is in [CHALLENGE.md](CHALLENGE.md). The original Dutch PDF lives in [resources/](resources/).

New teams can start with [START_HERE.md](START_HERE.md).

## Two layers

Teams pick one (or show how they connect):

1. **Layer 1  -  Demographic population.** Synthetic persons or households that match CBS *buurt* statistics on age, household composition, housing type, occupancy, work sector, mobility, and spatial location.
2. **Layer 2  -  Wastewater-surveillance context.** Link the synthetic population to RWZI (rioolwaterzuiveringsinstallatie) catchments and land-use data, so wastewater signals can be interpreted geographically and demographically.

## Repository layout

| Path | Purpose |
|---|---|
| [CHALLENGE.md](CHALLENGE.md) | Full challenge brief (English translation of the Dutch original) |
| [docs/](docs/) | Personas, scenarios, glossary, judging criteria, methodology notes, privacy guidance |
| [docs/README.md](docs/README.md) | Docs index for quick navigation during the hackathon |
| [docs/data-sources.md](docs/data-sources.md) | Every upstream source with URLs, licences and CBS table IDs |
| [docs/variables.md](docs/variables.md) | Human-readable variable catalogue with priority (must / should / could / would) |
| [data/variables.yaml](data/variables.yaml) | Machine-readable variable catalogue (source of truth) |
| [data/sources.yaml](data/sources.yaml) | Machine-readable source catalogue (URLs, licences) |
| [data/reference/](data/reference/) | Placeholder for downloaded upstream reference data (gitignored) |
| [data/synthetic/](data/synthetic/) | Where team-generated synthetic populations land |
| [tooling/](tooling/) | Optional Python starter: data fetchers, example IPF + MetaSyn scripts, catalogue tests |
| [resources/](resources/) | Original challenge brief (PDF) and the variable overview spreadsheet |

## Quick start: explore the variable catalogue

```powershell
cd tooling
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]

# Validate that the variable & source catalogues are well-formed
pytest -v

# Fetch a slice of CBS Kerncijfers wijken en buurten for one region
python -m fetchers.cbs_statline --table 86165NED --region "Utrecht" --out ..\data\reference

# Minimal IPF demo on one buurt
python examples\01_ipf_minimal.py --buurt BU03440101
```

The fetchers are deliberately thin wrappers around public CBS / RIVM open-data endpoints. **Teams are free to choose any synthesis method** (IPF, agent-based, generative models, …). The reference library [MetaSyn](https://github.com/sodascience/metasyn) is documented as an option but not required.

See [data/README.md](data/README.md) for the data dictionary and provenance rules and [docs/methoden.md](docs/methoden.md) for a short comparison of synthesis approaches.

## Variables at a glance

The full table is in [docs/variables.md](docs/variables.md). Must-have variables come from:

| CBS table | Topic |
|---|---|
| **86165NED** | Kerncijfers wijken en buurten  -  demographics, housing, income, work, urbanicity |
| **82275NED** | Hoogst behaald onderwijsniveau bevolking  -  education level |
| **70262NED** | Bodemgebruik in Nederland  -  land use (residential / industry / agriculture / green / water) |
| **85870NED** | Nabijheidsstatistieken  -  distance to hospitals, airports, care homes |
| **84709NED** | ODiN (Onderweg in Nederland)  -  daily mobility, commute distance |
| Emissieregistratie | RWZI register  -  locations, capacities, catchment |
| RIVM / NRS open GIS | RWZI catchment polygons |
| BAG | Addresses and buildings (open) |

Submissions must cover at least the must-have variables. See the [SynthData.xlsx](resources/SynthData.xlsx) source spreadsheet.

## Disclaimer

All data in this repository (and all output produced by the starter tooling) is **synthetic**. Upstream sources are **publicly available aggregate** statistics  -  no micro-data of real individuals is used. Prototypes built during the hackathon are research artefacts, not operational pandemic-preparedness systems, and require independent validation before any operational use.

## Licensing

- **Code** is released under the [Apache License 2.0](LICENSE).
- **Data, documentation, and challenge text** are released under [CC BY 4.0](LICENSE-DATA).
- Upstream open data keeps its own custodian licence (mostly CC BY for CBS); credit them when you redistribute derived data.

## Contributing

Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md). During the hackathon the rule is **one PR per team**.

