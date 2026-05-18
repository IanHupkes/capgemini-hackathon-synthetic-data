# Start Here (Hackathon Teams)

If you are starting the challenge now, follow this order.

## 1) Understand scope (10 min)

- Read [CHALLENGE.md](CHALLENGE.md).
- Skim [docs/beoordelingscriteria.md](docs/beoordelingscriteria.md).
- Check the must-have variables in [docs/variables.md](docs/variables.md).

## 2) Pick your approach (10 min)

- Population first: focus on Layer 1.
- Wastewater first: focus on Layer 2.
- Hybrid: do a thin Layer 1 + Layer 2 link for one region.

## 3) Set up tooling (10 min)

```powershell
cd tooling
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]
pytest -v
```

## 4) Pull reference data (20–30 min)

- CBS sample fetch:

```powershell
python -m fetchers.cbs_statline --table 86165NED --region "Utrecht" --out ..\data\reference
```

- RWZI data: manual export via Watson, then validate:
- RWZI data: manual export via Watson, then parse into normalized files:

```powershell
python -m fetchers.rwzi_register --out ..\data\reference
python -m fetchers.parse_watson_meetresultaten --in ..\data\reference\Watson_Meetresultaten.xlsx --out-dir ..\data\reference
```

- If no separate RWZI catchment source is available, use `rwzi_code` and `rwzi_locatie` from the parsed export as join keys and document this limitation in your quality report.

## 5) Build a first synthetic slice

- Use [tooling/examples/01_ipf_minimal.py](tooling/examples/01_ipf_minimal.py) as a baseline.
- Generate one neighbourhood/region end-to-end first.
- Save outputs in `data/synthetic/<your-team>/`.

## 6) Keep your submission valid

- Use only public/open data sources.
- Keep your method and code open source.
- Include source list and quality report.
- Cover all must-have variables.

Reference templates:
- [docs/kwaliteitsrapport-template.md](docs/kwaliteitsrapport-template.md)
- [docs/privacy-by-design.md](docs/privacy-by-design.md)