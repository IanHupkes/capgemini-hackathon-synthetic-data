package cap.datademie.synthdata.controller;

import cap.datademie.synthdata.dto.SynthPerson;
import cap.datademie.synthdata.dto.WebRequest;
import cap.datademie.synthdata.service.Service;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class Controller {

    @PostMapping(
            value = "/get-synth-pop",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = "text/csv"
    )
    public ResponseEntity<Set<SynthPerson>>generateSynthPop(@RequestBody WebRequest request) {

        WebRequest req = new WebRequest();
        req.wijkCode = "WK034401";

        // call service
        Set<SynthPerson> synthPop = Service.generateSynthPop(req);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=data.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(synthPop);
    }

}
