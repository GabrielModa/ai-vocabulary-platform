import type { z } from "zod";
import { AiCapabilityError, type AiResult } from "./execution.js";

export function validateAiResult<T>(schema: z.ZodType<T>, result: AiResult<unknown>): AiResult<T> {
  const value = schema.safeParse(result.value);
  if (!value.success || result.uncertainty < 0 || result.uncertainty > 1) {
    throw new AiCapabilityError("INVALID_OUTPUT");
  }
  return Object.freeze({ ...result, value: value.data });
}
