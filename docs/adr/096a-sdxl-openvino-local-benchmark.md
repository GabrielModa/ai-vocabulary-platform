# ADR-096A — Isolated SDXL/OpenVINO local benchmark

## Status

Accepted for experimentation; Intel GPU result rejected.

## Context

The existing local image engine is fast enough for development but can produce visual clues that do
not represent the selected lexical meaning. The development notebook has Intel integrated graphics
and no dedicated NVIDIA GPU. A larger model may be slow or fail under memory pressure, so replacing
the working engine before measuring it would be unsafe.

## Decision

Keep SDXL as an isolated benchmark path rather than changing the production worker. It uses
`OVStableDiffusionXLPipeline`, defaults to 512×512 and 20 steps, can target CPU or Intel GPU,
records latency and memory, and writes outside the approved production cache. Optional dependencies
remain inside the ignored `.venv-sdxl` environment.

On 2026-08-11, the Intel GPU completed an initial case in 66.84 seconds after a long cold compile.
Process RSS rose from about 3.53 GB to 6.55 GB while system-available memory fell to about 2.23 GB.
The PNG was fully black and Diffusers reported invalid values during conversion. A second run
completed in 70.47 seconds; the new validator measured dynamic range `0` and grayscale deviation
`0.0`, then returned a failing exit code. This rejects SDXL promotion on the current GPU path and
leaves the production LCM worker unchanged.

The run exposed two harness defects: the positive prompt exceeded CLIP's 77-token limit and a
constant black frame counted as success. Prompts are now compact and outputs are checked for
luminance range and deviation. Invalid frames remain in the ignored benchmark directory for local
diagnosis, appear as invalid in JSON, and produce a failing exit code.

## Consequences

The current Intel GPU result is not viable. CPU remains an optional diagnostic, not a release
blocker, because it cannot repair a GPU numerical failure within the interactive latency budget. Any
future SDXL promotion requires a visually valid benchmark and a separate safety integration.
