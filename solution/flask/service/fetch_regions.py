"""
Fetches a list of unique regions from CBS (86165NED - Kerncijfers wijken en buurten)
and writes them to regions.json.

Each entry contains:
  - code: the region code (e.g. "GM0518", "WK051800", "BU05180000")
  - name: the region name
  - type: the region type (e.g. "Gemeente", "Wijk", "Buurt")
"""

import json
import cbsodata
import pandas as pd

KERNCIJFERS_WIJKEN_BUURTEN = "86165NED"
OUTPUT_FILE = "regions.json"


def main() -> None:
    print(f"Fetching dataset {KERNCIJFERS_WIJKEN_BUURTEN} from CBS...")
    df = pd.DataFrame(cbsodata.get_data(KERNCIJFERS_WIJKEN_BUURTEN, select=["WijkenEnBuurten", "Codering_3", "SoortRegio_2"]))

    df["WijkenEnBuurten"] = df["WijkenEnBuurten"].str.strip()
    df["Codering_3"] = df["Codering_3"].str.strip()
    df["SoortRegio_2"] = df["SoortRegio_2"].str.strip()

    df = df.drop_duplicates(subset=["Codering_3"])
    df = df.sort_values(["SoortRegio_2", "Codering_3"])

    regions = [
        {
            "code": row["Codering_3"],
            "name": row["WijkenEnBuurten"],
            "type": row["SoortRegio_2"],
        }
        for _, row in df.iterrows()
    ]

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(regions, f, indent=2, ensure_ascii=False)

    print(f"Written {len(regions)} regions to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
