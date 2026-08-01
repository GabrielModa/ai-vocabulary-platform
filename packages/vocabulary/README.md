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

## Photo, review, and persistence boundaries

Photo ingestion accepts only supported image metadata with explicit consent, scans before
extraction, and deletes temporary media after both success and failure. Review operations require an
authenticated owner and an explicit selection. Persistence is isolated behind an ownership-safe,
optimistically versioned repository; the deterministic in-memory adapter supports application tests
until the database adapter is wired into the API composition root.

## Contextual retrieval training

Confirmed, approved candidates can produce one validated contextual challenge each through a
provider-neutral generator. The first session presents challenges sequentially, normalizes learner
answers, records immutable attempts, and immediately preserves the correct model for feedback. Its
score describes only that session and is deliberately separate from mastery, XP, and rewards.
