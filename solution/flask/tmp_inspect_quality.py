import json
import subprocess
import sys

macro = {
    "area": {"type": "buurt", "code": "BU05991051", "name": "Voorbeeldbuurt"},
    "population": 700,
    "marginals": {
        "leeftijd": {"0-14": 105, "15-24": 98, "25-44": 210, "45-64": 182, "65+": 105},
        "huishoudgrootte": {"1": 245, "2": 280, "3+": 175},
        "woningtype": {"appartement": 280, "rijtjeshuis": 315, "vrijstaand": 105},
        "opleidingsniveau": {"laag": 210, "midden": 315, "hoog": 175},
        "arbeidsmarktpositie": {"werkend": 420, "werkloos": 56, "arbeidsongeschikt": 224},
        "achtergrond": {"niet-westers": 140, "westers": 560},
    },
    "scalars": {"gemiddeld_inkomen_huishouden": 32000, "bezettingsgraad_woning": 2.3, "stedelijkheidsgraad": "sterk stedelijk", "nabijheid_luchthaven_km": 25},
}

r = subprocess.run([sys.executable, 'service/synthesiser.py', json.dumps(macro)], capture_output=True, text=True)
print('RC', r.returncode)
obj = json.loads(r.stdout)
print('HAS quality_report', 'quality_report' in obj)
print('QUALITY_REPORT', obj.get('quality_report'))
print('TOP_KEYS', list(obj.keys()))
print('CELL_COUNT_LEN', len(obj.get('cell_counts', {})))
print('POPULATION_LEN', len(obj.get('population', [])))
print('STDERR', r.stderr)
