"""Stub fetcher for the RWZI register from Emissieregistratie.

The public URL for the RWZI register changes occasionally; we do not pin a
hardcoded download URL here. For hackathon teams, the expected route is:
manual export via the Watson portal and save the file in data/reference/.

Watson entrypoint:
https://data.emissieregistratie.nl/watson

After download, validate the file schema with:
    python -m fetchers.validate_rwzi_export --in <path-to-export.csv>

Run:
    python -m fetchers.rwzi_register --out ../data/reference
"""

from __future__ import annotations

import argparse
from pathlib import Path

RWZI_REGISTER_URL = "https://data.emissieregistratie.nl/watson"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output directory.")
    args = parser.parse_args()
    out = Path(args.out)

    out.mkdir(parents=True, exist_ok=True)
    print(
        "Download the RWZI export manually via the Watson portal and "
        "save the file into:"
    )
    print(f"  {out}")
    print(f"Source: {RWZI_REGISTER_URL}")
    print(
        "Then validate the file with: "
        "python -m fetchers.validate_rwzi_export --in <downloaded-file>"
    )


if __name__ == "__main__":
    main()
