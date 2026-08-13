# Task 143 — Persist a hidden trusted distractor reserve

Generate a small trusted-first reserve separately from the learner-requested vocabulary set.

The reserve is enriched and stored only in `sourceCandidates`. It is not copied into the learner
candidate list and is not serialized in the public generation response. Publication can therefore
consume it through the safe supplemental pool introduced in Task 142.

The reserve is trusted-catalog only. Missing or unverified reserve entries are discarded and never
cause learner generation to fail.
