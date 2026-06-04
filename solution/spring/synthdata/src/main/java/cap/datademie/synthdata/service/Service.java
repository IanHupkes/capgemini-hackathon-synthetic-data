package cap.datademie.synthdata.service;

import cap.datademie.synthdata.dto.SynthPerson;
import cap.datademie.synthdata.dto.WebRequest;
import com.fasterxml.jackson.databind.ObjectMapper;


import java.io.*;
import java.util.Set;

public class Service {

    public static Set<SynthPerson> generateSynthPop(WebRequest req) {

        // 1. Extract input from request
        String wijkCode = req.wijkCode;
        System.out.print("Found wijkcode: " + wijkCode + "\n");

        // 2. Get macro data (JSON)
        String macroDataJson = MacroDataService.getMacroData(wijkCode);
        System.out.print("Macro data: " + macroDataJson  + "\n");

        // 3. Create synthetic population
        Set<SynthPerson> synthPop = createSynthPop(macroDataJson);
        System.out.print(" \nSynthetische populatie: " + synthPop  + "\n");

        // 4. Validate result
        validate(synthPop);
        System.out.print("post validatie"  + "\n");


        // 5. Return final result
        return synthPop;
    }

    // --- Step 2 ---
    private static Set<SynthPerson> createSynthPop(String macroDataJson) {
        // pseudo: parse JSON and build objects

        // e.g. use Jackson / ObjectMapper in real code

        // JsonNode data = objectMapper.readTree(macroDataJson);
        try {

            String test = callPythonSynthesiser(macroDataJson);
            System.out.print(test);
        } catch (Exception e) {
            System.out.print(e.getMessage());
        }

        return Set.of(); // replace with real generation logic
    }

    // --- Step 3 ---
    private static void validate(Set<SynthPerson> synthPop) {

//        if (synthPop == null || synthPop.isEmpty()) {
//            throw new IllegalStateException("Generated population is empty");
//        }

        // more validation rules:
        // - size matches macro data
        // - no null fields
        // - constraints OK
    }




    public static String callPythonSynthesiser(String json) throws Exception {

        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String pythonCmd = isWindows ? "python" : "python3";
        String scriptPath = java.nio.file.Paths.get("script", "synthesiser.py").toString();

        ProcessBuilder pb = new ProcessBuilder(
                pythonCmd,
                scriptPath,
                json
        );
//        ProcessBuilder pb = new ProcessBuilder("python", "synthesiser.py");

        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(process.getOutputStream())
        )) {
            writer.write(json);
            writer.flush();
        }

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        StringBuilder output = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            System.out.println("PYTHON: " + line);
            output.append(line).append("\n");
        }

        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException(
                    "Python script failed (exit " + exitCode + "):\n" + output
            );
        }

        return output.toString();
    }

}

