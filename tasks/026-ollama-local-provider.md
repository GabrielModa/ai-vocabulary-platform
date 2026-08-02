# 026 — Add local Ollama vocabulary provider

## Goal

Generate validated vocabulary and contextual challenges locally through Ollama without API keys.

## Requirements

- Default to `http://127.0.0.1:11434` and `qwen2.5:3b` with server-only overrides.
- Request non-streaming structured JSON and validate all untrusted model output.
- Preserve exact requested count and CEFR level; return safe availability/output errors.

## Files allowed

`packages/ai/**`, `tasks/**`, AI documentation.

## Expected commit

`feat(ai): add local Ollama vocabulary provider`
