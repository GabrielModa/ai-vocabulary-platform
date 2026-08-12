# ADR 0022: Separate verified transcription from browser speech synthesis

## Status

Accepted on 2026-08-12.

## Decision

Audio buttons use the browser's speech-synthesis voice and are represented by a decorative inline
SVG, avoiding source-encoding-dependent emoji glyphs. Their accessible names describe the text to be
spoken.

When the local CMU Pronouncing Dictionary provider returns an American-English ARPABET
transcription, Study mode may display it as `Verified US pronunciation · ARPABET`. The UI must not
call browser speech synthesis official audio, silently convert ARPABET to IPA, or invent a
Portuguese phonetic respelling.

## Consequences

- Speaker controls render consistently across encodings and fonts.
- Learners can inspect verifiable pronunciation evidence without confusing it with generated text.
- ARPABET is supplementary expert detail; a future licensed pronunciation-audio provider or a
  verified IPA source can improve learner friendliness without changing this trust boundary.
