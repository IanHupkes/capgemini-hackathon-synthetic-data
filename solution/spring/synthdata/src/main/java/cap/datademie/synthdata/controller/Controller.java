package cap.datademie.synthdata.controller;

import cap.datademie.synthdata.dto.WebRequest;
import cap.datademie.synthdata.service.Service;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class Controller {


    @PostMapping(
            value = "/get-synth-pop",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> generateSynthPop(@RequestBody WebRequest request) {

        String resultJson = Service.generateSynthPop(request);

        return ResponseEntity.ok(resultJson);
    }

}
