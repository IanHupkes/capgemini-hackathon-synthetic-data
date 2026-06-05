import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import cbsodata

KERNCIJFERS_WIJKEN_BUURTEN = "86165NED"
ONDERWIJS_NIVEAU = "82275NED"
_OUTPUT_DIR = Path(__file__).resolve().parent / "output"

FALLBACK_NAMES = {
    "BU05991042": "Bospolder",
    "BU05991045": "Tussendijken",
    "BU05991051": "Nieuwe Westen",
    "BU05990331": "Kralingen-West",
    "BU05990336": "Nieuw Crooswijk",
    "BU03631500": "Da Costabuurt",
    "BU03631503": "Helmersbuurt",
    "BU03632001": "Tuindorp Oostzaan",
    "BU03632004": "Molenwijk",
    "BU03440310": "Tuindorp",
    "BU03440312": "Voordorp",
    "BU05182801": "Laakkwartier-Oost",
    "BU05182803": "Spoorwijk",
    "BU07720512": "Strijp-S",
    "BU07720515": "Philipsdorp",
}

FALLBACK_POPULATIONS = {
    "BU05991042": 8120,
    "BU05991045": 9430,
    "BU05991051": 14870,
    "BU05990331": 11260,
    "BU05990336": 6040,
    "BU03631500": 7380,
    "BU03631503": 9910,
    "BU03632001": 6650,
    "BU03632004": 5120,
    "BU03440310": 8760,
    "BU03440312": 4980,
    "BU05182801": 13540,
    "BU05182803": 7290,
    "BU07720512": 5470,
    "BU07720515": 4310,
}

FALLBACK_TEMPLATE = {
    "area": {"type": "buurt", "code": None, "name": None},
    "population": 700,
    "marginals": {
        "leeftijd": {"0-14": 105, "15-24": 98, "25-44": 210, "45-64": 182, "65+": 105},
        "huishoudgrootte": {"1": 245, "2": 280, "3+": 175},
        "woningtype": {"appartement": 280, "rijtjeshuis": 315, "vrijstaand": 105},
        "opleidingsniveau": {"laag": 210, "midden": 315, "hoog": 175},
        "arbeidsmarktpositie": {"werkend": 420, "werkloos": 56, "arbeidsongeschikt": 224},
        "achtergrond": {"niet-westers": 140, "westers": 560},
    },
    "scalars": {
        "gemiddeld_inkomen_huishouden": 32000,
        "bezettingsgraad_woning": 2.3,
        "stedelijkheidsgraad": "sterk stedelijk",
        "nabijheid_luchthaven_km": 25,
    },
}

def convert_numpy(value):
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    return value


def strip_strings(obj):
    if isinstance(obj, dict):
        return {k: strip_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [strip_strings(v) for v in obj]
    elif isinstance(obj, str):
        return obj.strip()
    else:
        return obj


def _scale_counts(counts, target_total):
    items = list(counts.items())
    scaled = [round(value * target_total / 700.0) for _, value in items]
    diff = target_total - sum(scaled)
    if diff != 0 and items:
        scaled[0] += diff
    return {label: max(1, value) for (label, _), value in zip(items, scaled)}


def _fallback_macro(wijk_code: str):
    population = FALLBACK_POPULATIONS.get(str(wijk_code).strip().upper(), 700)
    macro = deepcopy(FALLBACK_TEMPLATE)
    code = str(wijk_code).strip().upper()
    macro['area']['code'] = code
    macro['area']['name'] = FALLBACK_NAMES.get(code, code)
    macro['population'] = population
    macro['marginals'] = {
        key: _scale_counts(value, population)
        for key, value in macro['marginals'].items()
    }
    return macro


def fetch_cbs_data(wijk_code: str):
    df_kerncijfers = pd.DataFrame(cbsodata.get_data(KERNCIJFERS_WIJKEN_BUURTEN))
    normalized_code = str(wijk_code).strip().upper()
    wijk_rows = df_kerncijfers[
        df_kerncijfers['Codering_3'].astype(str).str.strip().str.upper() == normalized_code
    ]

    if not wijk_rows.empty:
        print(f"Fetched CBS data for wijk {wijk_code}")
        wijk_row = wijk_rows.iloc[0]
    else:
        fallback = _fallback_macro(wijk_code)
        print(f"Using fallback macro data for wijk {wijk_code}")
        return strip_strings(fallback)
    df_onderwijs = pd.DataFrame(cbsodata.get_data(ONDERWIJS_NIVEAU, filters="Perioden eq '2021KW01'"))
    print("Fetched CBS data for onderwijs niveau")
    df_onderwijs_2021 = df_onderwijs[
        df_onderwijs['Perioden'].str.contains('2021 1e kwartaal') &
        ~df_onderwijs['Leeftijd'].str.contains('15', na=False) &
        df_onderwijs['Geslacht'].str.contains('Totaal') &
        ~(df_onderwijs['HoogstBehaaldOnderwijsniveau'].str.contains('Totaal') |
          df_onderwijs['HoogstBehaaldOnderwijsniveau'].str.contains('onbekend'))
        ]

    hoogst_behaalde_opleiding_raw = df_onderwijs_2021.groupby(df_onderwijs_2021['HoogstBehaaldOnderwijsniveau'].str[0])[
                                        'Bevolking_1'].sum() * 1000
    # Normalize national education distribution to wijk population so all marginals
    # are on the same (wijk-level) scale; avoids IPF inflating n to national totals.
    pop = float(wijk_row['AantalInwoners_5'] or 1)
    edu_total = float(hoogst_behaalde_opleiding_raw.sum()) or 1.0
    hoogst_behaalde_opleiding = hoogst_behaalde_opleiding_raw / edu_total * pop

    macro_json = {
        "area": {
            "type": wijk_row["SoortRegio_2"],
            "code": wijk_row["Codering_3"],
            "name": wijk_row["WijkenEnBuurten"]
        },
        "population": wijk_row['AantalInwoners_5'],
        "marginals": {
            "leeftijd": {
                "0-14": wijk_row["k_0Tot15Jaar_8"],
                "15-24": wijk_row["k_15Tot25Jaar_9"],
                "25-44": wijk_row["k_25Tot45Jaar_10"],
                "45-64": wijk_row["k_45Tot65Jaar_11"],
                "65+": wijk_row["k_65JaarOfOuder_12"]
            },
            "huishoudgrootte": {
                "1": wijk_row['Eenpersoonshuishoudens_30'],
                "2": wijk_row['HuishoudensZonderKinderen_31'],
                "3+": wijk_row['HuishoudensMetKinderen_32']
            },
            "woningtype": {
                "appartement": wijk_row['PercentageMeergezinswoning_45'] or 0,
                "rijtjeshuis": (wijk_row['PercentageTussenwoningEengezins_41'] or 0) + (wijk_row['PercentageHoekwoningEengezins_42'] or 0),
                "vrijstaand": (wijk_row['PercentageVrijstaandeWoningEengezins_44'] or 0) + (wijk_row['PercentageTweeOnderEenKapWoningEe_43'] or 0)
            },
            "opleidingsniveau": {
                "laag": hoogst_behaalde_opleiding.iloc[0],
                "midden": hoogst_behaalde_opleiding.iloc[1],
                "hoog": hoogst_behaalde_opleiding.iloc[2]
            },
            "arbeidsmarktpositie": {
                "werkend": wijk_row['WerkzameBeroepsbevolking_70'] or 0,
                "werkloos": (wijk_row['AantalInwoners_5'] or 0) - (wijk_row['WerkzameBeroepsbevolking_70'] or 0),
                "arbeidsongeschikt": wijk_row['PersonenPerSoortUitkeringAO_88'] or 0
            },
            "achtergrond": {
                "niet-westers": wijk_row['BuitenEuropa_19'],
                "westers": wijk_row['Nederland_17'] + wijk_row['EuropaExclusiefNederland_18']
            }
        },
        "scalars": {
            "gemiddeld_inkomen_huishouden": (wijk_row['GemiddeldeHuishoudensgrootte_33'] or 0.0) * (wijk_row['GemiddeldInkomenPerInwoner_78'] or 0.0),
            "bezettingsgraad_woning": wijk_row['GemiddeldeHuishoudensgrootte_33'],
            "stedelijkheidsgraad": wijk_row['MateVanStedelijkheid_120']
        }
    }

    cleaned_data = strip_strings(macro_json)

    _OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    path = _OUTPUT_DIR / f"{wijk_code}_macro_{timestamp}.json"
    with open(path, "w", encoding="utf-8") as file:
        json.dump(cleaned_data, file, indent=2, default=convert_numpy)
    return cleaned_data

if __name__ == "__main__":
    # fetch_cbs_data('GM0518')
    fetch_cbs_data('BU03440312')
