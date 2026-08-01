import { z } from "zod";
import { ConfigurationError } from "./errors.js";
import { environmentSchema, httpUrlSchema, optionalNonEmptyString } from "./primitives.js";

const webConfigSchema = z.object({
  NEXT_PUBLIC_APP_ENV: environmentSchema.default("development"),
  NEXT_PUBLIC_API_URL: httpUrlSchema,
  NEXT_PUBLIC_POSTHOG_KEY: optionalNonEmptyString,
  NEXT_PUBLIC_SENTRY_DSN: optionalNonEmptyString,
});

const mobileConfigSchema = z.object({
  EXPO_PUBLIC_APP_ENV: environmentSchema.default("development"),
  EXPO_PUBLIC_API_URL: httpUrlSchema,
  EXPO_PUBLIC_POSTHOG_KEY: optionalNonEmptyString,
  EXPO_PUBLIC_SENTRY_DSN: optionalNonEmptyString,
});

export type WebConfig = z.infer<typeof webConfigSchema>;
export type MobileConfig = z.infer<typeof mobileConfigSchema>;

function parseClientConfig<T>(
  scope: string,
  schema: z.ZodType<T>,
  environment: Record<string, string | undefined>,
): Readonly<T> {
  const result = schema.safeParse(environment);
  if (!result.success) throw new ConfigurationError(scope, result.error);
  return Object.freeze(result.data);
}

export function parseWebConfig(
  environment: Record<string, string | undefined>,
): Readonly<WebConfig> {
  return parseClientConfig("web client", webConfigSchema, environment);
}

export function parseMobileConfig(
  environment: Record<string, string | undefined>,
): Readonly<MobileConfig> {
  return parseClientConfig("mobile client", mobileConfigSchema, environment);
}
