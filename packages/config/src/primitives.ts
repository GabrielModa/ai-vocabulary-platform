import { z } from "zod";

export const environmentSchema = z.enum(["development", "test", "production"]);

export const httpUrlSchema = z.url({ protocol: /^https?$/u });

export const portSchema = z.coerce.number().int().min(1).max(65_535);

export const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
