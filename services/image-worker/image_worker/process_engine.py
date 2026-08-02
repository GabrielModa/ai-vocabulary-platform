from __future__ import annotations

from multiprocessing import get_context
from pathlib import Path
from queue import Empty
from threading import Lock
from uuid import uuid4

from image_worker.domain import SafetyDecision


def _run_engine(model_path: str, preferred_device: str, requests: object, results: object) -> None:
    from image_worker.openvino_engine import OpenVinoImageEngine

    engine = OpenVinoImageEngine(Path(model_path), preferred_device)
    try:
        engine.initialize()
        results.put(("initialized", engine.device, None))
    except Exception:
        results.put(("initialized", preferred_device, "pipeline_load_failed"))
        return

    while True:
        message = requests.get()
        if message is None:
            return
        request_id, prompt, destination = message
        try:
            decision = engine.generate(prompt, Path(destination))
            results.put((request_id, decision.safe, decision.checked_by))
        except Exception:
            results.put((request_id, False, "image_generation_failed"))


class ProcessImageEngine:
    """Own the OpenVINO pipeline in a child process so HTTP remains responsive."""

    def __init__(self, model_path: Path, device: str = "GPU"):
        self._model_path = model_path
        self._preferred_device = device
        self._device = device
        self._process = None
        self._requests = None
        self._results = None
        self._ready = False
        self._reason: str | None = "pipeline_not_initialized"
        self._lock = Lock()

    @property
    def device(self) -> str:
        return self._device

    def readiness(self) -> tuple[bool, str | None]:
        if self._process is not None and not self._process.is_alive():
            return False, "image_process_stopped"
        return self._ready, self._reason

    def initialize(self, timeout_seconds: int = 180) -> None:
        if self._process is not None:
            return
        context = get_context("spawn")
        self._requests = context.Queue()
        self._results = context.Queue()
        self._process = context.Process(
            target=_run_engine,
            args=(str(self._model_path), self._preferred_device, self._requests, self._results),
            daemon=True,
            name="openvino-image-engine",
        )
        self._process.start()
        try:
            message, device, reason = self._results.get(timeout=timeout_seconds)
        except Empty as error:
            self.close()
            self._reason = "pipeline_load_timeout"
            raise RuntimeError(self._reason) from error
        if message != "initialized" or reason is not None:
            self.close()
            self._reason = reason or "pipeline_load_failed"
            raise RuntimeError(self._reason)
        self._device = device
        self._ready = True
        self._reason = None

    def generate(self, prompt: str, destination: Path) -> SafetyDecision:
        with self._lock:
            ready, reason = self.readiness()
            if not ready or self._requests is None or self._results is None:
                raise RuntimeError(reason or "image_process_unavailable")
            request_id = uuid4().hex
            self._requests.put((request_id, prompt, str(destination)))
            try:
                result_id, safe, checked_by = self._results.get(timeout=240)
            except Empty as error:
                raise RuntimeError("image_generation_timeout") from error
            if result_id != request_id:
                raise RuntimeError("image_process_protocol_error")
            if checked_by == "image_generation_failed":
                raise RuntimeError(checked_by)
            return SafetyDecision(bool(safe), str(checked_by))

    def close(self) -> None:
        process, requests = self._process, self._requests
        self._ready = False
        if process is not None and process.is_alive():
            if requests is not None:
                requests.put(None)
            process.join(timeout=5)
            if process.is_alive():
                process.terminate()
                process.join(timeout=5)
        self._process = None
        self._requests = None
        self._results = None
