# Task 096A — SDXL/OpenVINO Local Benchmark

## Objective

Measure whether SDXL can produce useful sense-grounded vocabulary images on the current Intel
notebook before replacing the working image engine.

## Current checkpoint

The isolated benchmark harness is implemented and verified. Real model execution remains pending
because it may download several gigabytes and consume substantial CPU/GPU time. This task remains
open until at least one viable device produces an image and JSON report.

## Allowed files

- `.gitignore`
- `eslint.config.mjs`
- `docs/adr/096a-sdxl-openvino-local-benchmark.md`
- `services/image-worker/requirements-sdxl.txt`
- `services/image-worker/scripts/benchmark_sdxl.py`
- `services/image-worker/scripts/sdxl-benchmark-cases.json`
- `services/image-worker/scripts/setup-sdxl.ps1`
- `services/image-worker/scripts/setup-sdxl.sh`
- `services/image-worker/tests/test_sdxl_benchmark.py`
- `tasks/096a-sdxl-openvino-local-benchmark.md`

## Acceptance criteria

- Existing worker behavior remains unchanged.
- Optional SDXL dependencies use an isolated requirements file.
- Windows and Unix setup scripts are included.
- CPU and Intel GPU benchmark modes are available.
- Default output is 512×512 with 20 inference steps.
- Five difficult concepts are included.
- Prompts include term, exact meaning, and a concrete scene.
- Latency and memory metrics are written to JSON.
- Benchmark images never enter the approved production cache.
- The benchmark uses `.venv-sdxl` and never installs optional packages into the production worker
  `.venv`.
- The isolated benchmark environment is ignored by Git.
- Repository lint does not inspect third-party files inside the isolated benchmark environment.

## Verification

- Focused benchmark contract tests.
- Complete image-worker test suite.
- Git ignore verification for `.venv-sdxl` and benchmark outputs.
- One real benchmark case per viable device before considering worker integration.

## Rollback

Remove the optional requirements, scripts, tests, task, and ADR. The production worker remains
unchanged.
