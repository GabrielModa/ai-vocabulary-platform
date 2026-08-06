# Task 095 — Image Quality and Study UI Polish

## Objective

Close the MVP presentation gap by grounding visual clues in the selected meaning and concrete
example, while making the study screen resilient and presentable.

## Acceptance criteria

- Image requests include the trusted meaning and complete example scene.
- Worker prompts require a literal, single-focus educational illustration.
- Prompts explicitly discourage blur, malformed subjects, collage layouts, abstract symbolism, text,
  signs, logos, and watermarks.
- Existing request-derived image caching remains intact.
- Enqueue failure retries once and never blocks study.
- Internal study-session identifiers are not rendered.
- Images have bounded responsive dimensions.
- Sentences, feedback, alternatives, and result content wrap safely.
- Previous/next/check controls do not stretch into giant buttons.
- Mobile study layout remains usable.
- Focused web and worker tests, typecheck, lint, build, MVP verification, and formatting pass.
