from pathlib import Path
from threading import Lock
import json

from image_worker.domain import SafetyDecision

class OpenVinoImageEngine:
    """Compile the large pipeline once and reuse it for serialized jobs."""
    def __init__(self, model_path: Path, device: str = "GPU"):
        self._model_path, self._device = model_path, device
        self._pipeline = None
        self._lock = Lock()

    def _verify_safety_components(self) -> None:
        model_index = self._model_path / "model_index.json"
        safety_model = self._model_path / "safety_checker" / "openvino_model.xml"
        feature_config = self._model_path / "feature_extractor" / "preprocessor_config.json"
        if not model_index.is_file() or not safety_model.is_file() or not feature_config.is_file():
            raise RuntimeError("Model safety components are missing")
        components = json.loads(model_index.read_text(encoding="utf-8"))
        if not components.get("safety_checker") or not components.get("feature_extractor"):
            raise RuntimeError("Model does not declare its safety pipeline")

    def generate(self, prompt: str, destination: Path) -> SafetyDecision:
        import openvino_genai as ov_genai
        from PIL import Image
        with self._lock:
            if self._pipeline is None:
                self._verify_safety_components()
                self._pipeline = ov_genai.Text2ImagePipeline(str(self._model_path), self._device)
            result = self._pipeline.generate(prompt, width=512, height=512, num_inference_steps=4)
            destination.parent.mkdir(parents=True, exist_ok=True)
            image = Image.fromarray(result.data[0]).convert("RGB")
            # The model-integrated Stable Diffusion checker replaces rejected output with a black frame.
            extrema = image.getextrema()
            rejected = all(maximum <= 2 for _, maximum in extrema)
            if not rejected:
                image.save(destination, format="PNG")
            return SafetyDecision(not rejected, "openvino-model-safety-checker+black-frame-v1")
