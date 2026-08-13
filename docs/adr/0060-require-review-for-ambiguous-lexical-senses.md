# ADR-0060: Automatic selectors cannot authorize ambiguous lexical senses

## Status

Accepted on 2026-08-13.

## Decision

When a candidate has more than one selectable verified lexical sense for the proposed part of
speech, automatic contextual selection is advisory only. The candidate remains `needs-review`.

A unique verified provider sense may still be auto-selected. Learner-confirmed sense selection
remains authoritative.

## Rationale

A confidence score from a contextual model does not prove lexical correctness. The system has
already observed high-confidence selection of valid but topic-wrong OEWN senses. Failing closed on
ambiguity protects the trusted lexical boundary and prevents an incorrect sense from reaching
exercise publication.
