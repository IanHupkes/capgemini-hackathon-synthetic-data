import json
import subprocess
import sys
from pathlib import Path


def get_macro_data(wijk_code: str):
    """Build a macro-data payload and run the real synthesiser script."""
    macro = {
        "area": {
            "type": "buurt",
            "code": wijk_code,
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

    script_path = Path(__file__).resolve().parent / "synthesiser.py"
    completed = subprocess.run(
        [sys.executable, str(script_path), json.dumps(macro)],
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip() or "Synthesiser failed")

    return json.loads(completed.stdout)