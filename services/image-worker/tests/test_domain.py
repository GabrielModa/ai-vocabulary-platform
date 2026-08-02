import sys
from pathlib import Path
import unittest
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from image_worker.domain import ImageQueue, InvalidImageRequest, SafetyDecision, VocabularyImageRequest

class FakeEngine:
    def generate(self, prompt: str, destination: Path) -> None:
        destination.write_bytes(b"fake-png")
        return SafetyDecision(True, "test-checker")

class RejectingEngine:
    def generate(self, prompt: str, destination: Path):
        destination.write_bytes(b"unsafe")
        return SafetyDecision(False, "test-checker")

class DomainTest(unittest.TestCase):
    def request(self):
        return {"term": "goalkeeper", "meaning": "player", "context": "match", "level": "B1"}

    def test_accepts_bounded_fields_and_builds_controlled_prompt(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        self.assertIn("no written words", request.controlled_prompt())

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

    def test_reuses_approved_cache_after_restart(self):
        request = VocabularyImageRequest.from_unknown(self.request())
        with TemporaryDirectory() as directory:
            approved = Path(directory) / "approved"
            approved.mkdir()
            (approved / f"{request.job_id}.png").write_bytes(b"approved")
            queue = ImageQueue(FakeEngine(), Path(directory) / "quarantine", approved, start_worker=False)
            job, created = queue.submit(request)
            self.assertFalse(created)
            self.assertEqual(job.status, "ready")
            self.assertIsNotNone(queue.approved_file(job.id))

if __name__ == "__main__": unittest.main()
