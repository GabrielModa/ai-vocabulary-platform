# Vocabulary collection domain

Provider- and framework-neutral rules for learner-owned vocabulary collections created from typed
text, a topic plus requested count, or a photo reference.

All extracted or generated words begin as proposed candidates. The learner may edit them and must
explicitly select at least one candidate before the collection becomes confirmed and eligible for
training. Exact English-term/sense duplicates are rejected while separate senses remain distinct.

This package does not persist collections, invoke AI providers, store photo bytes, expose HTTP
routes, or implement training activities. Those responsibilities belong to later approved tasks.

## Typed input pipeline

Typed input accepts comma-, semicolon-, or newline-separated terms while preserving multi-word
phrases. It normalizes whitespace, removes duplicate entries, preserves order, and rejects more than
100 entries rather than truncating them. Language detection and linguistic analysis are ports; real
provider integrations are outside this package. Analyzer output must preserve every input in order
and pass structural validation before draft candidates are created.

## Topic generation pipeline

Topic input accepts a subject, a requested count from 1–100, and a CEFR level. Generation is a
provider-neutral port. Its output must contain exactly the requested number of unique term/sense
pairs and cover nouns, verbs, adjectives, collocations, phrasal verbs, and expressions as the count
allows. Invalid output is rejected rather than truncated or padded. Every accepted candidate remains
proposed and editable in a draft collection.
