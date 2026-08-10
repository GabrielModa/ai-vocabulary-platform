# ADR-096A — Isolated SDXL/OpenVINO local benchmark

## Status

Accepted for experimentation; benchmark execution pending.

## Context

The existing local image engine is fast enough for development but repeatedly produces visual clues
that do not represent the selected lexical meaning. The development notebook has Intel integrated
graphics and no dedicated NVIDIA GPU. A larger model may be slow or fail due to memory pressure, so
replacing the working engine before measuring it would be unsafe.

## Decision

Add SDXL as an isolated benchmark path rather than changing the production worker.

The benchmark uses `OVStableDiffusionXLPipeline`, defaults to 512×512 and 20 steps, can target CPU
or Intel GPU, records latency and memory, and writes its output outside the approved production
cache. The existing worker and HTTP API remain unchanged.

The optional dependencies live in `.venv-sdxl`, which is ignored by Git and separate from the
production worker `.venv`. The repository currently contains only the reproducible benchmark
scaffolding. No SDXL result may be used to justify worker integration until CPU or GPU execution
produces an image and JSON latency/memory report on the target notebook.

## Consequences

We can decide based on real quality, time, and memory measurements from this notebook. Promotion to
the worker, safety integration, timeout changes, and provider selection remain follow-up work after
reviewing the benchmark images.
