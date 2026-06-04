package cap.datademie.synthdata.controller;

import cap.datademie.synthdata.service.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class Controller {



    @PostMapping("/synth")
    public Map<String, String> createUser(@RequestBody Map<String, String> req) {
        Service.getMacroData();

        return null;
    }


}
