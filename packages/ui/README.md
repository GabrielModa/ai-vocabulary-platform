# Shared UI foundations

`@vocabulary/ui` provides versioned semantic tokens and equivalent web/native primitive contracts.
It does not contain product screens or platform-specific navigation.

## Entry points

- `@vocabulary/ui/tokens`: versioned semantic color, type, spacing, radius, motion, elevation, and
  state tokens.
- `@vocabulary/ui/web`: CSS-variable adapter, accessibility stylesheet, and Button/Text/Surface.
- `@vocabulary/ui/native`: React Native adapter and Button/Text/Surface.
- `@vocabulary/ui/contrast`: WCAG contrast utilities used by automated checks.

## State contract

Button supports `default`, `loading`, `success`, `warning`, and `error`. Loading and disabled
actions remain named but cannot be activated. Feedback always uses text or accessibility state as
well as color. Web focus is visible; native buttons expose button role, label, busy state, and
disabled state.

## Accessibility contract

- Minimum interactive target: 44 × 44 CSS pixels or density-independent pixels.
- Body text is scalable; native text uses `allowFontScaling` without a maximum multiplier.
- Normal text/color pairs pass WCAG 2.2 AA contrast.
- Reduced-motion feedback has zero-duration nonessential animation while state text remains.
- Product copy supplies the accessible label; icon-only actions must provide one explicitly.

Token names describe intent rather than screens. A breaking semantic change requires a token-version
increment and migration note.
