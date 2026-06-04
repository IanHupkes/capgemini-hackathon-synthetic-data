import sys
import json

def main():
    print("Python script started")  # helps verify it's running

    # Check if JSON argument is passed
    if len(sys.argv) > 1:
        try:
            input_json = sys.argv[1]
            data = json.loads(input_json)

            print("Received JSON:", data)

            # Return something simple
            result = {
                "status": "success",
                "echo": data
            }

        except Exception as e:
            result = {
                "status": "error",
                "message": str(e)
            }
    else:
        result = {
            "status": "no input"
        }

    # IMPORTANT: output JSON (this is what Java will read)
    print(json.dumps(result))


if __name__ == "__main__":
    main()