from pathlib import Path
from threading import Lock
import json

from image_worker.domain import SafetyDecision

class OpenVinoImageEngine:
    """Compile the large pipeline once and reuse it for serialized jobs."""
    def __init__(self, model_path: Path, device: str = "GPU"):
        self._model_path, self._device = model_path, device
        self._pipeline = None
        self._safety_checker = None
        self._safety_thresholds = None
        self._load_error = None
        self._loaded_device = None
        self._lock = Lock()

    @property
    def device(self) -> str:
        return self._loaded_device or self._device

    def _safety_artifacts(self) -> tuple[Path | None, Path | None]:
        safety_directory = self._model_path / "safety_checker"
        safety_model = next(
            (model for model in safety_directory.rglob("*.xml") if model.with_suffix(".bin").is_file()),
            None,
        )
        thresholds = next(safety_directory.rglob("thresholds.npz"), None)
        return safety_model, thresholds

    def artifact_readiness(self) -> tuple[bool, str | None]:
        model_index = self._model_path / "model_index.json"
        safety_directory = self._model_path / "safety_checker"
        safety_models = tuple(safety_directory.rglob("*.xml"))
        feature_configs = tuple((self._model_path / "feature_extractor").rglob("*.json"))
        if not model_index.is_file():
            return False, "model_index_missing"
        if not safety_models:
            if tuple(safety_directory.rglob("*.safetensors")):
                return False, "safety_checker_not_exported_to_openvino"
            return False, "safety_components_missing"
        if not any(model.with_suffix(".bin").is_file() for model in safety_models):
            return False, "safety_checker_weights_missing"
        if not tuple(safety_directory.rglob("thresholds.npz")):
            return False, "safety_checker_thresholds_missing"
        if not feature_configs:
            return False, "safety_components_missing"
        try:
            components = json.loads(model_index.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return False, "model_index_invalid"
        if not components.get("safety_checker") or not components.get("feature_extractor"):
            return False, "safety_pipeline_undeclared"
        return True, None

    def readiness(self) -> tuple[bool, str | None]:
        artifacts_ready, reason = self.artifact_readiness()
        if not artifacts_ready:
            return False, reason
        if self._load_error is not None:
            return False, self._load_error
        if self._pipeline is None or self._safety_checker is None:
            return False, "pipeline_not_initialized"
        return True, None

    def _verify_safety_components(self) -> None:
        ready, reason = self.artifact_readiness()
        if not ready:
            raise RuntimeError(reason or "model_not_ready")

    def initialize(self) -> None:
        import openvino_genai as ov_genai

        with self._lock:
            if self._pipeline is not None:
                return
            self._verify_safety_components()
            self._load_safety_checker()
            errors = []
            for device in dict.fromkeys((self._device, "CPU")):
                try:
                    self._pipeline = ov_genai.Text2ImagePipeline(str(self._model_path), device)
                    self._loaded_device = device
                    self._load_error = None
                    return
                except Exception as error:
                    errors.append(f"{device}:{type(error).__name__}")
            self._load_error = "pipeline_load_failed"
            raise RuntimeError(f"pipeline_load_failed ({', '.join(errors)})")

    def _load_safety_checker(self) -> None:
        if self._safety_checker is not None:
            return
        import numpy as np
        from openvino import Core

        safety_model, thresholds = self._safety_artifacts()
        if safety_model is None or thresholds is None:
            raise RuntimeError("safety_components_missing")
        self._safety_checker = Core().compile_model(str(safety_model), "CPU")
        with np.load(thresholds) as values:
            self._safety_thresholds = {name: values[name].copy() for name in values.files}

    def _is_safe(self, image: object) -> bool:
        import numpy as np
        from PIL import Image

        self._load_safety_checker()
        assert self._safety_checker is not None and self._safety_thresholds is not None
        rgb = image.convert("RGB")
        width, height = rgb.size
        scale = 224 / min(width, height)
        resized = rgb.resize((round(width * scale), round(height * scale)), Image.Resampling.BICUBIC)
        left, top = (resized.width - 224) // 2, (resized.height - 224) // 2
        cropped = resized.crop((left, top, left + 224, top + 224))
        pixels = np.asarray(cropped, dtype=np.float32) / 255.0
        mean = np.asarray([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
        std = np.asarray([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)
        pixels = ((pixels - mean) / std).transpose(2, 0, 1)[None]
        image_embed = self._safety_checker([pixels])[0]

        def cosine_distance(embeds: object) -> object:
            values = np.asarray(embeds, dtype=np.float32)
            normalized_image = image_embed / np.linalg.norm(image_embed, axis=-1, keepdims=True)
            normalized_values = values / np.linalg.norm(values, axis=-1, keepdims=True)
            return normalized_image @ normalized_values.T

        adjustment = 0.0
        special_scores = cosine_distance(self._safety_thresholds["special_care_embeds"])[0]
        for score, threshold in zip(
            special_scores, self._safety_thresholds["special_care_embeds_weights"], strict=True
        ):
            if round(float(score - threshold + adjustment), 3) > 0:
                adjustment = 0.01
        concept_scores = cosine_distance(self._safety_thresholds["concept_embeds"])[0]
        return not any(
            round(float(score - threshold + adjustment), 3) > 0
            for score, threshold in zip(
                concept_scores, self._safety_thresholds["concept_embeds_weights"], strict=True
            )
        )

    def generate(self, prompt: str, destination: Path) -> SafetyDecision:
        from PIL import Image
        if self._pipeline is None:
            self.initialize()
        with self._lock:
            assert self._pipeline is not None
            result = self._pipeline.generate(prompt, width=512, height=512, num_inference_steps=4)
            destination.parent.mkdir(parents=True, exist_ok=True)
            image = Image.fromarray(result.data[0]).convert("RGB")
            approved = self._is_safe(image)
            if approved:
                image.save(destination, format="PNG")
            return SafetyDecision(approved, "stable-diffusion-safety-checker-openvino-v1")
