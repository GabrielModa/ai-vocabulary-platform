# Adaptive learning loop verification

The integration test in `apps/web/src/adaptive-learning-loop.test.ts` exercises the same local
history projection and adaptive planning adapters used by the learner UI.

It verifies the full deterministic loop:

1. repeated successful retrieval increases stability and advances the exercise to typed recall;
2. an incorrect typed response is retained as an immutable lapse event;
3. the spacing engine schedules that sense six hours later;
4. the next planner prioritizes it as `lapsed-due`;
5. the exercise progression returns it to definition recognition for supported recovery.

The loop does not use XP, streaks, CEFR, images, or AI output as mastery evidence.
