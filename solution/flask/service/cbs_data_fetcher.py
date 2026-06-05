import json
import numpy as np
import pandas as pd
import cbsodata

KERNCIJFERS_WIJKEN_BUURTEN = "86165NED"
ONDERWIJS_NIVEAU = "82275NED"

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


def fetch_cbs_data(wijk_code: str):
    df_kerncijfers = pd.DataFrame(cbsodata.get_data(KERNCIJFERS_WIJKEN_BUURTEN))
    wijk_row = df_kerncijfers[df_kerncijfers["Codering_3"].str.contains(wijk_code)].iloc[0]
    df_onderwijs = pd.DataFrame(cbsodata.get_data(ONDERWIJS_NIVEAU))
    df_onderwijs_2021 = df_onderwijs[
        df_onderwijs['Perioden'].str.contains('2021 1e kwartaal') &
        ~df_onderwijs['Leeftijd'].str.contains('15', na=False) &
        df_onderwijs['Geslacht'].str.contains('Totaal') &
        ~(df_onderwijs['HoogstBehaaldOnderwijsniveau'].str.contains('Totaal') |
          df_onderwijs['HoogstBehaaldOnderwijsniveau'].str.contains('onbekend'))
        ]

    hoogst_behaalde_opleiding = df_onderwijs_2021.groupby(df_onderwijs_2021['HoogstBehaaldOnderwijsniveau'].str[0])[
                                    'Bevolking_1'].sum() * 1000

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
                "rijtjeshuis": wijk_row['PercentageTussenwoningEengezins_41'] or 0 + wijk_row['PercentageHoekwoningEengezins_42'] or 0,
                "vrijstaand": wijk_row['PercentageVrijstaandeWoningEengezins_44'] or 0 + wijk_row['PercentageTweeOnderEenKapWoningEe_43'] or 0
            },
            "opleidingsniveau": {
                "laag": hoogst_behaalde_opleiding.iloc[0],
                "midden": hoogst_behaalde_opleiding.iloc[1],
                "hoog": hoogst_behaalde_opleiding.iloc[2]
            },
            "arbeidsmarktpositie": {
                "werkend": wijk_row['WerkzameBeroepsbevolking_70'] or 0,
                "werkloos": wijk_row['AantalInwoners_5'] - (
                            wijk_row['WerkzameBeroepsbevolking_70'] or wijk_row['AantalInwoners_5']),
                "arbeidsongeschikt": wijk_row['PersonenPerSoortUitkeringAO_88'] or 0
            },
            "achtergrond": {
                "niet-westers": wijk_row['BuitenEuropa_19'],
                "westers": wijk_row['Nederland_17'] + wijk_row['EuropaExclusiefNederland_18']
            }
        },
        "scalars": {
            "gemiddeld_inkomen_huishouden": wijk_row['GemiddeldeHuishoudensgrootte_33'] or 0.0 * wijk_row[
                'GemiddeldInkomenPerInwoner_78'] or 0.0,
            "bezettingsgraad_woning": wijk_row['GemiddeldeHuishoudensgrootte_33'],
            "stedelijkheidsgraad": wijk_row['MateVanStedelijkheid_120']
        }
    }

    cleaned_data = strip_strings(macro_json)

    with open("macro_data.json", "w", encoding="utf-8") as file:
        json.dump(cleaned_data, file, indent=2, default=convert_numpy)
    return cleaned_data

if __name__ == "__main__":
    fetch_cbs_data('GM0518')
