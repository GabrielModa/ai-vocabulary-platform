# Product and learning-science audit

## Current assessment

The product has a strong technical learning foundation: trusted lexical evidence, active recall,
immediate feedback, immutable attempts, mastery updates, spacing, adaptive exercise progression,
wrong-answer practice, audio, and contextual personalization. The main remaining risk is no longer
basic feature absence; it is whether the system measures and improves actual retention instead of
only producing plausible exercises.

## Highest-priority gaps

### 1. Sense-level learning outcomes

Mastery must be attached to the studied lexical sense and exercise capability, not merely the
surface word. A learner may know `bank` as a financial institution but not as a river bank. Progress
should distinguish recognition, contextual recall, spelling, and production for each sense.

### 2. Delayed retention evidence

Immediate correctness is weak evidence of durable learning. Product metrics should separate:

- first-attempt recall;
- same-session correction;
- next-day recall;
- seven-day retention;
- lapse after prior mastery;
- response latency and hint use.

Scheduling should optimize delayed retention, not session score or engagement alone.

### 3. CEFR calibration beyond sentence length

The current deterministic example screen controls obvious complexity but does not certify CEFR.
Mature calibration needs curated frequency bands, grammatical-feature constraints, lexical profile,
sentence complexity, register, and human-reviewed benchmark cases. The UI must not label generated
content “CEFR verified” until that evidence exists.

### 4. Semantic and naturalness evaluation

Structural validation cannot prove that a sentence uses the intended sense naturally. Add a licensed
example corpus, sense-bound regression fixtures, and eventually a separate evaluator with strict
evidence. Never allow the same generator to be the only judge of its output.

### 5. Productive retrieval progression

Multiple choice is useful early but produces recognition more readily than recall. The progression
should be explicit:

1. definition recognition;
2. contextual multiple choice;
3. cloze with reduced cues;
4. typed recall;
5. sentence completion without options;
6. original sentence production;
7. transfer to a new context.

Advancement must depend on demonstrated mastery, not only CEFR or number of sessions.

### 6. Context variation with interference control

Three contexts are valuable only when they are meaningfully different and preserve the same sense.
The system needs diversity measures and should mix related words carefully: enough semantic
interference to require discrimination, but not ambiguous questions with two acceptable answers.

### 7. Honest learner control

Partial sets, provisional examples, missing pronunciation, and uncertain senses must remain visible.
The learner should be able to start with four good items, remove a poor item, regenerate only the
deficit, and understand why something was withheld.

## Recommended product metrics

- percentage of requested words with verified senses;
- percentage with verified versus provisional examples;
- percentage that publish at least one exercise strategy;
- first-attempt accuracy by sense and exercise kind;
- delayed recall at 1, 7, and 30 days;
- median response latency without hints;
- ambiguity/rejection rate by generator and topic;
- retry rate and latency per usable item;
- proportion progressing from recognition to typed or productive recall;
- learner corrections to senses, examples, and questions.

Avoid optimizing total questions answered, streak length, or time in app as primary learning
outcomes.

## Recommended order

1. Learning-set readiness and honest partial-set UX.
2. Sense-and-capability mastery audit.
3. Delayed-retention metrics and scheduler verification.
4. CEFR benchmark suite.
5. Licensed example provider and semantic regression suite.
6. Productive recall and transfer exercises.
7. Context-diversity scoring.
8. Images as optional dual-coding enrichment.
