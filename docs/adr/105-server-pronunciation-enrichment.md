# ADR 105 — Pronunciation enrichment is optional and evidence-only

## Status

Accepted.

## Decision

Vocabulary generation loads CMUdict from an optional local index and enriches each normalized
candidate independently. Valid records are returned in source order with provenance. Provider
absence, an unknown word, or invalid output leaves pronunciation absent while preserving the rest of
the vocabulary set.

The enrichment does not manufacture IPA, phonetic hints, or audio URLs. It also does not allow a
pronunciation-provider failure to replace verified lexical facts.
