# Local vocabulary model comparison

## Method

Run the same uncatalogued matrix through Ollama, lexical enrichment, deterministic validation, and
deficit replacement:

```powershell
$env:OLLAMA_MODEL = "qwen2.5:3b"
pnpm.cmd benchmark:vocabulary -- --model-comparison

$env:OLLAMA_MODEL = "qwen3:4b"
pnpm.cmd benchmark:vocabulary -- --model-comparison
```

The matrix contains photography A2, gardening B1, and negotiation C1, requesting six candidates per
case. Output is content-free and records model identity, exact fulfillment, rejected candidates,
attempts, and stage latency.

## Target machine

- Windows
- Python 3.12.10
- Approximately 16 GB RAM
- Intel Iris Xe integrated GPU
- Ollama local runtime

## Results

Measured locally on 2026-08-18. Each model received the same prompts, JSON schema, token budget,
temperature, lexical providers, validation, and replacement limit. Thinking was disabled.

| Model      | Successful cases | Delivered | Rejected then replaced | Suggestion p50 | Suggestion p95 | Replacement p50 | Result |
| ---------- | ---------------: | --------: | ---------------------: | -------------: | -------------: | --------------: | ------ |
| qwen2.5:3b |              3/3 |     18/18 |                      2 |       7,741 ms |      18,804 ms |       16,021 ms | Pass   |
| gemma3:4b  |              3/3 |     18/18 |                      3 |      11,722 ms |      26,703 ms |       22,813 ms | Pass   |
| qwen3:4b   |              0/3 |      0/18 |                      0 |              — |              — |               — | Fail   |

Qwen3 returned `INVALID_OUTPUT` for all three strict pipeline cases even though a separate simple
schema smoke request succeeded. The production retry and exclusion contract therefore exposes a
reliability problem that a basic prompt does not. Gemma 3 completed the matrix, but rejected one
more candidate and was approximately 51% slower at median candidate suggestion and 42% slower at
median complete replacement than Qwen 2.5 in this run.

## Decision

Keep `qwen2.5:3b` as the default local candidate model. It was the fastest passing model and had the
fewest rejected candidates. Keep model selection configurable through `OLLAMA_MODEL`; neither newly
downloaded model is promoted. The next quality gain should come from evaluating generated examples
and exercises separately rather than replacing the candidate model based on generic capability.

## Promotion rule

Prefer the smallest model that produces materially better exact fulfillment and fewer rejected
candidates without an unacceptable latency increase. Do not promote a model based only on generic
leaderboards or fluent-looking unverified output.
