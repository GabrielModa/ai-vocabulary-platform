import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from image_worker.domain import VocabularyImageRequest


class ImagePromptQualityTest(unittest.TestCase):
    def test_prompt_anchors_the_exact_meaning_and_example_scene(self):
        request = VocabularyImageRequest.from_unknown(
            {
                "term": "bank",
                "meaning": "a financial institution",
                "context": "a financial institution. Example scene: She deposits money at the bank.",
                "level": "B1",
            }
        )

        prompt = request.controlled_prompt()

        self.assertIn("Exact intended meaning: a financial institution", prompt)
        self.assertIn("Concrete scene to illustrate:", prompt)
        self.assertIn("one literal everyday scene", prompt)
        self.assertIn("crisp edges", prompt)
        self.assertIn("Avoid photorealism, blur", prompt)
        self.assertIn("watermarks", prompt)


if __name__ == "__main__":
    unittest.main()
