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
              "dimensions": {
                "leeftijd": ["0-14", "15-24", "25-44", "45-64", "65+"],
                "huishoudgrootte": ["1", "2", "3+"]
              },
              "marginals": {
                "leeftijd": [120, 180, 350, 220, 130],
                "huishoudgrootte": [200, 300, 200]
              },
              "total_population": 700
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

