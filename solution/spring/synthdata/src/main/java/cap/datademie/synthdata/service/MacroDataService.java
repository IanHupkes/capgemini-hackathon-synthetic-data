package cap.datademie.synthdata.service;

public class MacroDataService {

    public static String getMacroData(String wijkCode) {

        return """
            {
              "area": {
                "type": "buurt",
                "code": "BU001",
                "name": "Voorbeeldbuurt"
              },
              "population": 700,
              "marginals": {
                "leeftijd": {
                  "0-14": 105,
                  "15-24": 98,
                  "25-44": 210,
                  "45-64": 182,
                  "65+": 105
                },
                "huishoudgrootte": {
                  "1": 245,
                  "2": 280,
                  "3+": 175
                },
                "woningtype": {
                  "appartement": 280,
                  "rijtjeshuis": 315,
                  "vrijstaand": 105
                },
                "opleidingsniveau": {
                  "laag": 210,
                  "midden": 315,
                  "hoog": 175
                },
                "arbeidsmarktpositie": {
                  "werkend": 420,
                  "werkloos": 56,
                  "arbeidsongeschikt": 224
                },
                "achtergrond": {
                  "niet-westers": 140,
                  "westers": 560
                }
              },
              "scalars": {
                "gemiddeld_inkomen_huishouden": 32000,
                "bezettingsgraad_woning": 2.3,
                "stedelijkheidsgraad": "sterk stedelijk",
                "nabijheid_luchthaven_km": 25
              }
            }
        """;
    }
}