"""Fetch open RWZI spatial data from PDOK WFS (RIONED GWSW).

Downloads two GeoJSON files:
- RWZI point locations (`beheerstedelijkwater:BeheerBouwwerk`)
- management areas (`beheerstedelijkwater:BeheerGebied`)

Run:
    python -m fetchers.rwzi_register --out ../data/reference
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from urllib.parse import urlencode
from pathlib import Path

import requests

PDOK_WFS_URL = (
    "https://service.pdok.nl/rioned/beheer-stedelijk-watersystemen-gwsw/wfs/v1_0"
)


def _fetch_geojson(base_url: str, type_name: str, count: int | None) -> dict:
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": type_name,
        "outputFormat": "application/json",
    }
    if count is not None:
        params["count"] = str(count)

    response = requests.get(base_url, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output directory.")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional feature limit for quick testing.",
    )
    args = parser.parse_args()
    out = Path(args.out)
    limit = args.limit

    out.mkdir(parents=True, exist_ok=True)

    rwzi = _fetch_geojson(PDOK_WFS_URL, "beheerstedelijkwater:BeheerBouwwerk", limit)
    gebieden = _fetch_geojson(PDOK_WFS_URL, "beheerstedelijkwater:BeheerGebied", limit)

    rwzi_path = out / "pdok_gwsw_rwzi.geojson"
    gebieden_path = out / "pdok_gwsw_beheergebied.geojson"
    metadata_path = out / "pdok_gwsw_fetch_metadata.json"

    rwzi_path.write_text(json.dumps(rwzi, ensure_ascii=False), encoding="utf-8")
    gebieden_path.write_text(json.dumps(gebieden, ensure_ascii=False), encoding="utf-8")

    metadata = {
        "source": "pdok-rioned-gwsw-wfs",
        "base_url": PDOK_WFS_URL,
        "fetched_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "limit": limit,
        "layers": {
            "beheerstedelijkwater:BeheerBouwwerk": {
                "url": f"{PDOK_WFS_URL}?{urlencode({'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature', 'typeNames': 'beheerstedelijkwater:BeheerBouwwerk', 'outputFormat': 'application/json'})}",
                "features": len(rwzi.get("features", [])),
                "output": str(rwzi_path),
            },
            "beheerstedelijkwater:BeheerGebied": {
                "url": f"{PDOK_WFS_URL}?{urlencode({'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature', 'typeNames': 'beheerstedelijkwater:BeheerGebied', 'outputFormat': 'application/json'})}",
                "features": len(gebieden.get("features", [])),
                "output": str(gebieden_path),
            },
        },
        "notes": [
            "Use beheerstedelijkwater:BeheerBouwwerk for point locations.",
            "Use beheerstedelijkwater:BeheerGebied as best available open area layer.",
        ],
    }
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {rwzi_path} ({len(rwzi.get('features', []))} features)")
    print(f"Wrote {gebieden_path} ({len(gebieden.get('features', []))} features)")
    print(f"Wrote {metadata_path}")


if __name__ == "__main__":
    main()

