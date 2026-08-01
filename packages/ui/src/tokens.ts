import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);
const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().nonnegative();

export const designTokensSchema = z.object({
  version: z.literal("1.0.0"),
  color: z.object({
    background: hexColor,
    surface: hexColor,
    surfaceRaised: hexColor,
    border: hexColor,
    text: hexColor,
    textMuted: hexColor,
    primary: hexColor,
    onPrimary: hexColor,
    focus: hexColor,
    success: hexColor,
    warning: hexColor,
    error: hexColor,
    info: hexColor,
    disabled: hexColor,
  }),
  typography: z.object({
    family: z.object({ body: z.string().min(1), display: z.string().min(1) }),
    size: z.object({
      xs: positiveNumber,
      sm: positiveNumber,
      md: positiveNumber,
      lg: positiveNumber,
      xl: positiveNumber,
      display: positiveNumber,
    }),
    lineHeight: z.object({
      compact: positiveNumber,
      body: positiveNumber,
      relaxed: positiveNumber,
    }),
    weight: z.object({ regular: positiveNumber, medium: positiveNumber, bold: positiveNumber }),
  }),
  space: z.object({
    none: nonNegativeNumber,
    xs: positiveNumber,
    sm: positiveNumber,
    md: positiveNumber,
    lg: positiveNumber,
    xl: positiveNumber,
    xxl: positiveNumber,
  }),
  radius: z.object({
    none: nonNegativeNumber,
    sm: positiveNumber,
    md: positiveNumber,
    lg: positiveNumber,
    pill: positiveNumber,
  }),
  motion: z.object({
    duration: z.object({
      instant: nonNegativeNumber,
      fast: positiveNumber,
      normal: positiveNumber,
    }),
    easing: z.object({ standard: z.string().min(1), emphasized: z.string().min(1) }),
    reducedDuration: z.literal(0),
  }),
  elevation: z.object({
    none: z.object({ x: z.number(), y: z.number(), blur: nonNegativeNumber }),
    raised: z.object({ x: z.number(), y: z.number(), blur: nonNegativeNumber }),
    overlay: z.object({ x: z.number(), y: z.number(), blur: nonNegativeNumber }),
  }),
  state: z.object({
    minTarget: z.number().min(44),
    focusWidth: positiveNumber,
    disabledOpacity: z.number().min(0).max(1),
  }),
});

export const designTokens = designTokensSchema.parse({
  version: "1.0.0",
  color: {
    background: "#090b10",
    surface: "#10131b",
    surfaceRaised: "#191d28",
    border: "#3a4050",
    text: "#f7f8fa",
    textMuted: "#b9becb",
    primary: "#a9a2ff",
    onPrimary: "#090b10",
    focus: "#d6d2ff",
    success: "#6ee7a8",
    warning: "#f6c86a",
    error: "#ff9aaa",
    info: "#78c8ff",
    disabled: "#818899",
  },
  typography: {
    family: {
      body: "Inter, ui-sans-serif, system-ui, sans-serif",
      display: "Inter, ui-sans-serif, system-ui, sans-serif",
    },
    size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, display: 44 },
    lineHeight: { compact: 1.1, body: 1.5, relaxed: 1.7 },
    weight: { regular: 400, medium: 600, bold: 800 },
  },
  space: { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { none: 0, sm: 8, md: 12, lg: 20, pill: 999 },
  motion: {
    duration: { instant: 0, fast: 120, normal: 220 },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
    reducedDuration: 0,
  },
  elevation: {
    none: { x: 0, y: 0, blur: 0 },
    raised: { x: 0, y: 8, blur: 24 },
    overlay: { x: 0, y: 20, blur: 60 },
  },
  state: { minTarget: 44, focusWidth: 3, disabledOpacity: 0.55 },
});

export type DesignTokens = z.infer<typeof designTokensSchema>;
export type SemanticState = "default" | "loading" | "success" | "warning" | "error";
