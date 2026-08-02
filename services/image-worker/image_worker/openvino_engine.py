from pathlib import Path
from threading import Lock

class OpenVinoImageEngine:
    """Compile the large pipeline once and reuse it for serialized jobs."""
    def __init__(self, model_path: Path, device: str = "GPU"):
        self._model_path, self._device = model_path, device
        self._pipeline = None
        self._lock = Lock()

    def generate(self, prompt: str, destination: Path) -> None:
        import openvino_genai as ov_genai
        from PIL import Image
        with self._lock:
            if self._pipeline is None:
                self._pipeline = ov_genai.Text2ImagePipeline(str(self._model_path), self._device)
            result = self._pipeline.generate(prompt, width=512, height=512, num_inference_steps=4)
            destination.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(result.data[0]).save(destination, format="PNG")
