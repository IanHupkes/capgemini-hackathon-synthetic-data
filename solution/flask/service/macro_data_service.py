import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from cbs_data_fetcher import fetch_cbs_data

def get_macro_data(wijk_code: str):
    return fetch_cbs_data(wijk_code)