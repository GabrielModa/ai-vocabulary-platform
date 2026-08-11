# ADR-0044 — Keep the local vocabulary model warm for 30 minutes

## Status

Accepted

## Context

The local benchmark measured candidate suggestion at 7.9–20.1 seconds while deterministic lexical
enrichment stayed below 0.1 seconds. The cold model load dominates the first request, and Ollama may
unload an inactive model between study sessions.

## Decision

Set Ollama `keep_alive` to 30 minutes for vocabulary requests. Preserve the existing 15-minute
verified request cache, structured schema, prompt, temperature, token budget, retry rules, and all
downstream validation.

## Consequences

- Requests within a typical study period avoid repeated model loading.
- The model retains memory for longer, increasing local RAM use during that bounded period.
- Cold-start latency still exists after inactivity or service restart.
- Common-topic latency should ultimately be removed through trusted local lexical candidate pools.
