import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from image_worker.domain import ImageQueue, InvalidImageRequest, VocabularyImageRequest

class FakeEngine:
    def generate(self, prompt: str, destination: Path) -> None:
        destination.write_bytes(b"fake-png")

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
        queue = ImageQueue(FakeEngine(), Path("unused"), start_worker=False)
        first, created = queue.submit(request)
        second, created_again = queue.submit(request)
        self.assertTrue(created)
        self.assertFalse(created_again)
        self.assertIs(first, second)

if __name__ == "__main__": unittest.main()
