package cap.datademie.synthdata.service;

import cap.datademie.synthdata.dto.SynthPerson;
import cap.datademie.synthdata.dto.WebRequest;

import java.util.Set;

public class Service {

    public static Set<SynthPerson> generateSynthPop(WebRequest req) {

        // 1. Extract input from request
        String wijkCode = req.wijkCode;

        // 2. Get macro data (JSON)
        String macroDataJson = getMacroData(wijkCode);

        // 3. Create synthetic population
        Set<SynthPerson> synthPop = createSynthPop(macroDataJson);

        // 4. Validate result
        validate(synthPop);

        // 5. Return final result
        return synthPop;
    }

    // --- Step 1 ---
    private static String getMacroData(String wijkCode) {

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

    // --- Step 2 ---
    private static Set<SynthPerson> createSynthPop(String macroDataJson) {
        // pseudo: parse JSON and build objects

        // e.g. use Jackson / ObjectMapper in real code

        // JsonNode data = objectMapper.readTree(macroDataJson);

        return Set.of(); // replace with real generation logic
    }

    // --- Step 3 ---
    private static void validate(Set<SynthPerson> synthPop) {

        if (synthPop == null || synthPop.isEmpty()) {
            throw new IllegalStateException("Generated population is empty");
        }

        // more validation rules:
        // - size matches macro data
        // - no null fields
        // - constraints OK
    }
}

