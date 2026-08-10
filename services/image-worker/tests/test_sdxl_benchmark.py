import sys
from pathlib import Path
import unittest

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT / "scripts"))

from benchmark_sdxl import load_cases, visual_prompt


class SdxlBenchmarkTest(unittest.TestCase):
    def test_setup_scripts_use_the_isolated_benchmark_environment(self):
        powershell = (SERVICE_ROOT / "scripts" / "setup-sdxl.ps1").read_text(encoding="utf-8")
        shell = (SERVICE_ROOT / "scripts" / "setup-sdxl.sh").read_text(encoding="utf-8")
        gitignore = (SERVICE_ROOT.parents[1] / ".gitignore").read_text(encoding="utf-8")
        eslint_config = (SERVICE_ROOT.parents[1] / "eslint.config.mjs").read_text(encoding="utf-8")
        self.assertIn(".venv-sdxl", powershell)
        self.assertIn(".venv-sdxl", shell)
        self.assertIn("/services/image-worker/.venv-sdxl/", gitignore)
        self.assertIn("**/.venv-sdxl/**", eslint_config)

    def test_benchmark_cases_cover_the_difficult_vocabulary_set(self):
        cases = load_cases(SERVICE_ROOT / "scripts" / "sdxl-benchmark-cases.json")
        self.assertEqual(
            [case["term"] for case in cases],
            ["disappointment", "anxiety", "aunt", "corner", "fixture"],
        )

    def test_prompt_is_grounded_in_meaning_and_concrete_scene(self):
        prompt = visual_prompt(
            "disappointment",
            "dissatisfaction because expectations were not realized",
            "A player sits after losing a final.",
        )
        self.assertIn("exact target concept", prompt)
        self.assertIn("dissatisfaction because expectations were not realized", prompt)
        self.assertIn("A player sits after losing a final", prompt)
        self.assertIn("No text", prompt)
        self.assertIn("unrelated objects", prompt)


if __name__ == "__main__":
    unittest.main()
