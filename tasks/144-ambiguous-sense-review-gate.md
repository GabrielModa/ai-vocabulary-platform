# Task 144 — Require review for ambiguous lexical senses

Ambiguous candidates with more than one verified same-POS lexical sense must not become
authoritative from an automatic contextual selector, even when that selector reports high
confidence.

Unique verified senses remain auto-resolvable. Ambiguous candidates remain reviewable and can only
become authoritative after the learner explicitly confirms the intended sense.

This closes the factual-risk path observed with football terms such as `ball` and `match`, where an
automatic selector chose a valid OEWN sense that was wrong for the requested topic.
