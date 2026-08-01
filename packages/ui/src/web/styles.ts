import { designTokens } from "../tokens.js";

export const webAccessibilityStyles = `
[data-ui-button]:focus-visible {
  outline: ${String(designTokens.state.focusWidth)}px solid ${designTokens.color.focus};
  outline-offset: 3px;
}

@media (prefers-reduced-motion: no-preference) {
  [data-ui-motion] {
    transition-duration: ${String(designTokens.motion.duration.fast)}ms;
    transition-timing-function: ${designTokens.motion.easing.standard};
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui-motion] {
    transition-duration: ${String(designTokens.motion.reducedDuration)}ms;
    animation-duration: ${String(designTokens.motion.reducedDuration)}ms;
  }
}
`;
