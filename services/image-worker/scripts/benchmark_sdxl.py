from __future__ import annotations

import argparse
import json
import os
import platform
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import psutil
from PIL import Image, ImageStat

DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
DEFAULT_CASES = Path(__file__).with_name("sdxl-benchmark-cases.json")
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "generated" / "benchmarks" / "sdxl"


@dataclass(frozen=True)
class BenchmarkResult:
    term: str
    elapsed_seconds: float
    output_file: str
    process_rss_before_mb: float
    process_rss_after_mb: float
    system_available_before_mb: float
    system_available_after_mb: float
    device: str
    width: int
    height: int
    steps: int
    visually_valid: bool
    dynamic_range: int
    grayscale_deviation: float


def memory_snapshot() -> tuple[float, float]:
    process = psutil.Process(os.getpid())
    return (
        process.memory_info().rss / 1024 / 1024,
        psutil.virtual_memory().available / 1024 / 1024,
    )


def visual_prompt(term: str, meaning: str, context: str) -> str:
    return (
        f"Educational illustration. The exact target concept is '{term}', meaning: {meaning}. "
        f"Literal scene: {context} No text."
    )


def image_quality(image: Image.Image) -> tuple[bool, int, float]:
    grayscale = image.convert("L")
    minimum, maximum = grayscale.getextrema()
    dynamic_range = int(maximum) - int(minimum)
    deviation = float(ImageStat.Stat(grayscale).stddev[0])
    return dynamic_range >= 24 and deviation >= 8.0, dynamic_range, round(deviation, 2)


def load_cases(path: Path) -> list[dict[str, str]]:
    value: Any = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list):
        raise ValueError("Benchmark cases must be a JSON array")
    cases: list[dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            raise ValueError("Each benchmark case must be an object")
        normalized: dict[str, str] = {}
        for field in ("term", "meaning", "context"):
            candidate = item.get(field)
            if not isinstance(candidate, str) or not candidate.strip():
                raise ValueError(f"Invalid benchmark field: {field}")
            normalized[field] = candidate.strip()
        cases.append(normalized)
    return cases


def create_pipeline(model: str, device: str, width: int, height: int):
    from optimum.intel import OVStableDiffusionXLPipeline

    print(f"[sdxl] Loading {model} on {device}. First run may download several GB.")
    pipeline = OVStableDiffusionXLPipeline.from_pretrained(model, compile=False)
    try:
        pipeline.reshape(
            batch_size=1,
            height=height,
            width=width,
            num_images_per_prompt=1,
        )
    except TypeError:
        pipeline.reshape(1, height, width, 1)
    if hasattr(pipeline, "to"):
        pipeline.to(device)
    print("[sdxl] Compiling OpenVINO pipeline. This can take several minutes.")
    pipeline.compile()
    return pipeline


def run() -> int:
    parser = argparse.ArgumentParser(
        description="Benchmark SDXL/OpenVINO locally without replacing the production image engine."
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--device", default=os.environ.get("SDXL_DEVICE", "CPU"))
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=512)
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    if args.width % 8 or args.height % 8:
        parser.error("width and height must be divisible by 8")
    if args.steps < 1:
        parser.error("steps must be positive")

    cases = load_cases(args.cases)
    if args.limit is not None:
        cases = cases[: args.limit]
    if not cases:
        parser.error("no benchmark cases selected")

    args.output.mkdir(parents=True, exist_ok=True)
    print(json.dumps({
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "device": args.device,
        "model": args.model,
        "resolution": f"{args.width}x{args.height}",
        "steps": args.steps,
        "cases": len(cases),
    }, indent=2))

    pipeline = create_pipeline(args.model, args.device, args.width, args.height)
    results: list[BenchmarkResult] = []

    for index, case in enumerate(cases, start=1):
        prompt = visual_prompt(case["term"], case["meaning"], case["context"])
        before_rss, before_available = memory_snapshot()
        started = time.perf_counter()
        generated = pipeline(
            prompt=prompt,
            negative_prompt=(
                "text, letters, caption, watermark, logo, sign, label, blurry, low contrast, haze, "
                "abstract symbolism, collage, split screen, duplicate person, malformed hands, "
                "extra fingers, unrelated objects"
            ),
            width=args.width,
            height=args.height,
            num_inference_steps=args.steps,
            num_images_per_prompt=1,
        )
        elapsed = time.perf_counter() - started
        after_rss, after_available = memory_snapshot()
        output_file = args.output / f"{index:02d}-{case['term']}.png"
        image = generated.images[0]
        image.save(output_file)
        visually_valid, dynamic_range, grayscale_deviation = image_quality(image)
        result = BenchmarkResult(
            term=case["term"],
            elapsed_seconds=round(elapsed, 2),
            output_file=str(output_file),
            process_rss_before_mb=round(before_rss, 1),
            process_rss_after_mb=round(after_rss, 1),
            system_available_before_mb=round(before_available, 1),
            system_available_after_mb=round(after_available, 1),
            device=args.device,
            width=args.width,
            height=args.height,
            steps=args.steps,
            visually_valid=visually_valid,
            dynamic_range=dynamic_range,
            grayscale_deviation=grayscale_deviation,
        )
        results.append(result)
        print(
            f"[sdxl] {result.term}: {result.elapsed_seconds}s, "
            f"visually_valid={result.visually_valid} -> {output_file}"
        )

    report = {
        "model": args.model,
        "device": args.device,
        "average_seconds": round(sum(item.elapsed_seconds for item in results) / len(results), 2),
        "results": [asdict(item) for item in results],
    }
    report_file = args.output / "benchmark-report.json"
    report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"[sdxl] Report: {report_file}")
    return 0 if all(item.visually_valid for item in results) else 2


if __name__ == "__main__":
    raise SystemExit(run())
