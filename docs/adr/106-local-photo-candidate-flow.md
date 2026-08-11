# ADR 106 — Vision proposes terms; lexical providers establish facts

## Status

Accepted.

## Decision

The photo endpoint accepts a bounded in-memory image after explicit consent and sends it to a local
Ollama vision model. The model may identify visible English vocabulary candidates but cannot supply
authoritative definitions, pronunciation, CEFR, or senses. Its normalized terms are passed to the
normal generation and lexical-enrichment route, then shown in the existing review screen.

The server does not persist the source photo, extracted private text, filesystem paths, or the
model's raw response. Prompts forbid identity and sensitive-trait inference. Invalid model output
fails closed.
