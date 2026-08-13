# Task 142 — Expand the definition-choice distractor pool safely

## Goal

Allow reviewed definition-choice publication to use verified lexical source candidates beyond the
learner-selected set without trusting an ambiguous automatically selected sense.

## Scope of this checkpoint

- Keep learner-reviewed candidates authoritative for targets.
- Admit a non-reviewed source candidate only when exactly one verified lexical sense matches its
  part of speech and has a definition.
- Build supplemental `WordKnowledge` with `single-verified-sense` provenance.
- Continue routing every supplemental item through the deterministic pedagogical distractor gate.
- Never expose supplemental candidates as learner-selected vocabulary.
- Fail closed when the safe supplemental pool still cannot supply three credible alternatives.

## Explicit non-goal

This checkpoint does not yet generate or persist a larger hidden candidate set. It makes the
publication layer safe and ready to consume one. A follow-up generation checkpoint can persist
additional trusted-first candidates without changing the learner-requested vocabulary count.
