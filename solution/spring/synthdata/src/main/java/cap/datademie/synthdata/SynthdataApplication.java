package cap.datademie.synthdata;

import cap.datademie.synthdata.dto.WebRequest;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static cap.datademie.synthdata.service.Service.generateSynthPop;

@SpringBootApplication
public class SynthdataApplication {

	public static void main(String[] args) {

		SpringApplication.run(SynthdataApplication.class, args);

		WebRequest req = new WebRequest();
		req.wijkCode = "BU001";

		System.out.print("got hur 1");
		try {
			String result = generateSynthPop(req);
			System.out.println("Result: " + result);
		} catch (Exception e) {
			e.printStackTrace();
		}


	}

}
