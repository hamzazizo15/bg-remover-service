import os
os.environ["U2NET_HOME"] = "/tmp/.u2net"
os.environ["HOME"] = "/tmp"

from flask import Flask, request, send_file
from rembg import remove
import io

app = Flask(__name__)

@app.route("/")
def health():
    return {"status": "ok"}

@app.route("/remove-background", methods=["POST"])
def remove_background():
    if "image" not in request.files:
        return {"error": "no image provided"}, 400
    input_bytes = request.files["image"].read()
    output_bytes = remove(input_bytes)
    return send_file(io.BytesIO(output_bytes), mimetype="image/png")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
