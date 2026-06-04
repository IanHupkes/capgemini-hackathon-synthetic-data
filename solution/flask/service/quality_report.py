from flask import Flask, request, jsonify

from service.macro_data_service import get_macro_data
from service.synthesiser import synthesise

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "API is running"
    })

@app.route("/random-wijk", methods=["GET"])
def random_wijk():
    wijk_code = random.choice(["BU001", "BU002", "BU003", "BU004", "BU005"])

    macroData = get_macro_data(wijk_code)

    synthData = synthesise(macroData)

    return jsonify({
        "received": {"wijk_code": wijk_code},
        "message": "JSON processed successfully",
        "result": synthData
    }), 200

@app.route("/get-synth", methods=["POST"])
def handle_post():
    data = request.get_json(silent=True)
    print("Received JSON:", data)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    wijk_code = data.get("wijk_code")
    if not wijk_code:
        return jsonify({"error": "Missing wijk_code in JSON body"}), 400

    result = get_macro_data(wijk_code)

    response = {
        "received": data,
        "message": "JSON processed successfully",
        "result": result
    }

    return jsonify(response), 200


if __name__ == "__main__":
    app.run(debug=True)