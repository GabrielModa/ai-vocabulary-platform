import sys
import time
from pathlib import Path
import unittest
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from image_worker.domain import ImageQueue, InvalidImageRequest, SafetyDecision, VocabularyImageRequest
from image_worker.openvino_engine import OpenVinoImageEngine

class FakeEngine:
    def generate(self, prompt: str, destination: Path) -> None:
        destination.write_bytes(b"fake-png")
        return SafetyDecision(True, "test-checker")

class RejectingEngine:
    def generate(self, prompt: str, destination: Path):
        destination.write_bytes(b"unsafe")
        return SafetyDecision(False, "test-checker")

class FailingEngine:
    def generate(self, prompt: str, destination: Path):
        raise RuntimeError("provider failure")

class DomainTest(unittest.TestCase):
    def request(self):
        return {"term": "goalkeeper", "meaning": "player", "context": "match", "level": "B1"}

    def wait_for_terminal(self, queue: ImageQueue, job_id: str):
        deadline = time.monotonic() + 2
        while time.monotonic() < deadline:
            job = queue.get(job_id)
            if job and job.status not in {"queued", "generating"}:
                return job
            time.sleep(0.01)
        self.fail("image job did not reach a terminal state")

    def test_accepts_bounded_fields_and_builds_controlled_prompt(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        prompt = request.controlled_prompt()
        self.assertIn("single uncluttered educational drawing", prompt)
        self.assertIn("not a photograph", prompt)
        self.assertIn("one central observable subject or action", prompt)
        self.assertIn("do not show or spell the target word", prompt)
        self.assertIn("supporting memory clue", prompt)

    def test_rejects_raw_prompt_and_invalid_level(self):
        raw = {**self.request(), "prompt": "raw"}
        with self.assertRaises(InvalidImageRequest): VocabularyImageRequest.from_unknown(raw)
        invalid = {**self.request(), "level": "A1"}
        with self.assertRaises(InvalidImageRequest): VocabularyImageRequest.from_unknown(invalid)

    def test_stable_id_and_queue_deduplication(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        queue = ImageQueue(FakeEngine(), Path("unused"), Path("unused-approved"), start_worker=False)
        first, created = queue.submit(request)
        second, created_again = queue.submit(request)
        self.assertTrue(created)
        self.assertFalse(created_again)
        self.assertIs(first, second)

    def test_rejects_disallowed_concepts(self):
        value = {**self.request(), "term": "weapon"}
        with self.assertRaises(InvalidImageRequest): VocabularyImageRequest.from_unknown(value)
        sensitive_context = {**self.request(), "context": "A bombing affected nearby buildings."}
        with self.assertRaises(InvalidImageRequest): VocabularyImageRequest.from_unknown(sensitive_context)

    def test_reuses_approved_cache_after_restart(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        with TemporaryDirectory() as directory:
            approved = Path(directory) / "approved"
            approved.mkdir()
            (approved / f"{request.job_id}.png").write_bytes(b"approved")
            queue = ImageQueue(FakeEngine(), Path(directory) / "quarantine", approved, start_worker=False)
            job, created = queue.submit(request)
            self.assertFalse(created)
            self.assertEqual(job.status, "approved")
            self.assertIsNotNone(queue.approved_file(job.id))

    def test_approves_only_checked_output(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        with TemporaryDirectory() as directory:
            root = Path(directory)
            queue = ImageQueue(FakeEngine(), root / "quarantine", root / "approved")
            job, _ = queue.submit(request)
            terminal = self.wait_for_terminal(queue, job.id)
            self.assertEqual(terminal.status, "approved")
            self.assertIsNotNone(queue.approved_file(job.id))

    def test_rejected_and_failed_outputs_are_not_served(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        for engine, expected in ((RejectingEngine(), "rejected"), (FailingEngine(), "failed")):
            with self.subTest(expected=expected), TemporaryDirectory() as directory:
                root = Path(directory)
                queue = ImageQueue(engine, root / "quarantine", root / "approved")
                job, _ = queue.submit(request)
                terminal = self.wait_for_terminal(queue, job.id)
                self.assertEqual(terminal.status, expected)
                self.assertIsNone(queue.approved_file(job.id))

    def test_health_readiness_checks_model_safety_files(self):
        with TemporaryDirectory() as directory:
            model = Path(directory)
            engine = OpenVinoImageEngine(model)
            self.assertEqual(engine.artifact_readiness(), (False, "model_index_missing"))
            (model / "safety_checker" / "nested").mkdir(parents=True)
            (model / "feature_extractor" / "nested").mkdir(parents=True)
            (model / "model_index.json").write_text(
                '{"safety_checker":["transformers","checker"],"feature_extractor":["transformers","extractor"]}'
            )
            safety_model = model / "safety_checker" / "nested" / "model.xml"
            safety_model.write_text("<xml />")
            (model / "feature_extractor" / "nested" / "processor.json").write_text("{}")
            self.assertEqual(engine.artifact_readiness(), (False, "safety_checker_weights_missing"))
            safety_model.with_suffix(".bin").write_bytes(b"weights")
            self.assertEqual(engine.artifact_readiness(), (False, "safety_checker_thresholds_missing"))
            (model / "safety_checker" / "nested" / "thresholds.npz").write_bytes(b"thresholds")
            self.assertEqual(engine.artifact_readiness(), (True, None))
            self.assertEqual(engine.readiness(), (False, "pipeline_not_initialized"))

    def test_health_rejects_unconverted_safety_checker(self):
        with TemporaryDirectory() as directory:
            model = Path(directory)
            (model / "safety_checker").mkdir(parents=True)
            (model / "feature_extractor").mkdir(parents=True)
            (model / "model_index.json").write_text(
                '{"safety_checker":["stable_diffusion","StableDiffusionSafetyChecker"],'
                '"feature_extractor":["transformers","CLIPImageProcessor"]}'
            )
            (model / "safety_checker" / "model.safetensors").write_bytes(b"pytorch weights")
            (model / "feature_extractor" / "preprocessor_config.json").write_text("{}")
            self.assertEqual(
                OpenVinoImageEngine(model).artifact_readiness(),
                (False, "safety_checker_not_exported_to_openvino"),
            )

if __name__ == "__main__": unittest.main()
