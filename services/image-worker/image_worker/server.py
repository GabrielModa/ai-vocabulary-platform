from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlparse

from image_worker.domain import ImageQueue, InvalidImageRequest, VocabularyImageRequest
from image_worker.openvino_engine import OpenVinoImageEngine

ROOT = Path(__file__).resolve().parents[1]
queue = ImageQueue(
    OpenVinoImageEngine(ROOT / "models" / "lcm-dreamshaper-int8"),
    ROOT / "generated" / "quarantine",
    ROOT / "cache" / "approved",
)

class Handler(BaseHTTPRequestHandler):
    server_version = "VocabularyImageWorker/0.1"
    def _json(self, status: HTTPStatus, body: object) -> None:
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self._json(HTTPStatus.OK, {"status": "ok", "device": "GPU"})
            return
        prefix = "/v1/images/jobs/"
        if path.startswith(prefix):
            job = queue.get(path.removeprefix(prefix))
            self._json(HTTPStatus.OK, job.public()) if job else self._json(HTTPStatus.NOT_FOUND, {"error": "Job not found"})
            return
        file_prefix = "/v1/images/files/"
        if path.startswith(file_prefix):
            image = queue.approved_file(path.removeprefix(file_prefix))
            if image is None:
                self._json(HTTPStatus.NOT_FOUND, {"error": "Approved image not found"})
                return
            payload = image.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(payload)
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/v1/images/jobs":
            self._json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 4096:
                raise InvalidImageRequest("Invalid body size")
            request = VocabularyImageRequest.from_unknown(json.loads(self.rfile.read(length)))
            job, created = queue.submit(request)
            self._json(HTTPStatus.ACCEPTED if created else HTTPStatus.OK, job.public())
        except (InvalidImageRequest, json.JSONDecodeError, UnicodeDecodeError):
            self._json(HTTPStatus.BAD_REQUEST, {"error": "Invalid vocabulary image request"})

    def log_message(self, format: str, *args: object) -> None:
        return

def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("Vocabulary image worker: http://127.0.0.1:8765")
    print("Images remain quarantined until safety approval is implemented.")
    server.serve_forever()

if __name__ == "__main__":
    main()
