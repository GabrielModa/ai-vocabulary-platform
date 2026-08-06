# ADR-095 — Sense-grounded visual clues and focused study UI

## Status

Accepted.

## Context

Manual MVP use confirmed that local image generation worked, but visual clues were frequently
blurry, abstract, or unrelated. The client sometimes sent only a definition as context, which gave
the image model no concrete scene to illustrate. The study screen also exposed an internal session
identifier and allowed image, sentence, navigation, and result content to overflow or dominate the
layout.

## Decision

Image requests now combine the trusted meaning with the generated example sentence. The worker
prompt explicitly anchors the exact intended meaning, requests one literal everyday scene, and
rejects blur, distortion, duplicate subjects, abstract symbolism, text, signs, watermarks, and
unrelated content.

The existing content-addressed job ID continues to cache images by the complete request. The client
retries enqueueing once, while preserving image generation as optional enrichment.

The study UI hides internal identifiers and adds bounded image dimensions, wrapping, responsive
navigation, compact controls, and stable mobile behavior.

## Consequences

Images receive substantially stronger semantic and compositional guidance without changing the
worker API. Cached images remain deterministic for identical term, meaning, context, and level
requests. Visual failure never blocks learning. This task improves quality but does not claim that
the compact local model can meet production-grade visual quality in every case.
