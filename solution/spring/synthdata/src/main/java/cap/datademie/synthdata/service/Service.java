package cap.datademie.synthdata.service;

import cap.datademie.synthdata.dto.WebRequest;

import java.io.*;

public class Service {

    public static String generateSynthPop(WebRequest req) {

        // 1. Extract input from request
        String wijkCode = req.wijkCode;
        System.out.print("Found wijkcode: " + wijkCode + "\n");

        // 2. Get macro data (JSON)
        String macroDataJson = MacroDataService.getMacroData(wijkCode);
        System.out.print("Macro data: " + macroDataJson  + "\n");

        // 3. Create synthetic population
        String synthPop = createSynthPop(macroDataJson);
        System.out.print(" \nSynthetische populatie: " + synthPop  + "\n");

        // 5. Return final result
        return synthPop;
    }

    // --- Step 2 ---
    private static String createSynthPop(String macroDataJson) {
        String pythonJson = null;

        try {
            pythonJson = callPythonSynthesiser(macroDataJson);
            System.out.print(pythonJson);
        } catch (Exception e) {
            System.out.print(e.getMessage());
        }

        return pythonJson; // replace with real generation logic
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

