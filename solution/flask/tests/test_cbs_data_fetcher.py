import unittest
from unittest.mock import patch

import pandas as pd

from service.cbs_data_fetcher import fetch_cbs_data


def _make_kerncijfers():
    return pd.DataFrame([
        {
            "SoortRegio_2": "Buurt",
            "Codering_3": "BU99999999",
            "WijkenEnBuurten": "Verkeerd gebied",
            "AantalInwoners_5": 1,
            "k_0Tot15Jaar_8": 0,
            "k_15Tot25Jaar_9": 0,
            "k_25Tot45Jaar_10": 0,
            "k_45Tot65Jaar_11": 0,
            "k_65JaarOfOuder_12": 0,
            "Eenpersoonshuishoudens_30": 0,
            "HuishoudensZonderKinderen_31": 0,
            "HuishoudensMetKinderen_32": 0,
            "GemiddeldeHuishoudensgrootte_33": 0,
            "GemiddeldInkomenPerInwoner_78": 0,
            "MateVanStedelijkheid_120": 0,
            "PercentageMeergezinswoning_45": 0,
            "PercentageTussenwoningEengezins_41": 0,
            "PercentageHoekwoningEengezins_42": 0,
            "PercentageVrijstaandeWoningEengezins_44": 0,
            "PercentageTweeOnderEenKapWoningEe_43": 0,
            "WerkzameBeroepsbevolking_70": 0,
            "PersonenPerSoortUitkeringAO_88": 0,
            "BuitenEuropa_19": 0,
            "Nederland_17": 0,
            "EuropaExclusiefNederland_18": 0,
        },
        {
            "SoortRegio_2": "Buurt",
            "Codering_3": "BU05991051",
            "WijkenEnBuurten": "Nieuwe Westen",
            "AantalInwoners_5": 200,
            "k_0Tot15Jaar_8": 10,
            "k_15Tot25Jaar_9": 20,
            "k_25Tot45Jaar_10": 30,
            "k_45Tot65Jaar_11": 40,
            "k_65JaarOfOuder_12": 100,
            "Eenpersoonshuishoudens_30": 0,
            "HuishoudensZonderKinderen_31": 0,
            "HuishoudensMetKinderen_32": 0,
            "GemiddeldeHuishoudensgrootte_33": 0,
            "GemiddeldInkomenPerInwoner_78": 0,
            "MateVanStedelijkheid_120": 0,
            "PercentageMeergezinswoning_45": 0,
            "PercentageTussenwoningEengezins_41": 0,
            "PercentageHoekwoningEengezins_42": 0,
            "PercentageVrijstaandeWoningEengezins_44": 0,
            "PercentageTweeOnderEenKapWoningEe_43": 0,
            "WerkzameBeroepsbevolking_70": 0,
            "PersonenPerSoortUitkeringAO_88": 0,
            "BuitenEuropa_19": 0,
            "Nederland_17": 0,
            "EuropaExclusiefNederland_18": 0,
        },
    ])


def _make_onderwijs():
    return pd.DataFrame([
        {
            "Perioden": "2021 1e kwartaal",
            "Leeftijd": "25-44 jaar",
            "Geslacht": "Totaal",
            "HoogstBehaaldOnderwijsniveau": "Laag",
            "Bevolking_1": 100,
        },
        {
            "Perioden": "2021 1e kwartaal",
            "Leeftijd": "25-44 jaar",
            "Geslacht": "Totaal",
            "HoogstBehaaldOnderwijsniveau": "Middelbaar",
            "Bevolking_1": 100,
        },
        {
            "Perioden": "2021 1e kwartaal",
            "Leeftijd": "25-44 jaar",
            "Geslacht": "Totaal",
            "HoogstBehaaldOnderwijsniveau": "Hoog",
            "Bevolking_1": 100,
        },
    ])


class FetchCbsDataTests(unittest.TestCase):
    def test_fetch_cbs_data_uses_requested_code(self):
        import service.cbs_data_fetcher as cbs_data_fetcher

        def fake_get_data(dataset, filters=None):
            if dataset == cbs_data_fetcher.KERNCIJFERS_WIJKEN_BUURTEN:
                return _make_kerncijfers().to_dict("records")
            if dataset == cbs_data_fetcher.ONDERWIJS_NIVEAU:
                return _make_onderwijs().to_dict("records")
            raise AssertionError(f"Unexpected dataset {dataset}")

        with patch("service.cbs_data_fetcher.cbsodata.get_data", side_effect=fake_get_data):
            data = fetch_cbs_data("BU05991051")

        self.assertEqual(data["area"]["code"], "BU05991051")
        self.assertEqual(data["area"]["name"], "Nieuwe Westen")
        self.assertEqual(data["population"], 200)


if __name__ == "__main__":
    unittest.main()
