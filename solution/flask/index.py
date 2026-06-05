from flask import Flask, request, jsonify

from service.macro_data_service import get_macro_data
from service.synthesiser import synthesise

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    return response

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "API is running"
    })

@app.route("/random-wijk", methods=["GET"])
def random_wijk():
    wijk_code = "BU001"
    
    macroData = get_macro_data(wijk_code)

    synthData = synthesise(macroData)

    return jsonify({
        "received": {"wijk_code": wijk_code},
        "message": "JSON processed successfully",
        "result": synthData
    }), 200

@app.route("/get-synth", methods=["POST", "OPTIONS"])
def handle_post():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True) or {}
    print("Received JSON:", data)

    buurt_code = data.get("buurt_code") or data.get("wijk_code")
    if not buurt_code:
        return jsonify({"error": "Missing buurt_code or wijk_code in JSON body"}), 400

    macro = get_macro_data("BU01931000")
    synthData = synthesise(macro)

    response = {
        "received": {"buurt_code": buurt_code},
        "message": "JSON processed successfully",
        "result": synthData
    }

    return jsonify(response), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)