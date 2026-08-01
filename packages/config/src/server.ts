import { z } from "zod";
import { ConfigurationError } from "./errors.js";
import {
  environmentSchema,
  httpUrlSchema,
  optionalNonEmptyString,
  portSchema,
} from "./primitives.js";

const serverConfigSchema = z.object({
  NODE_ENV: environmentSchema.default("development"),
  PORT: portSchema.default(3001),
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/u }),
  REDIS_URL: z.url({ protocol: /^rediss?$/u }),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: httpUrlSchema,
  OPENAI_API_KEY: optionalNonEmptyString,
  R2_ACCOUNT_ID: optionalNonEmptyString,
  R2_ACCESS_KEY_ID: optionalNonEmptyString,
  R2_SECRET_ACCESS_KEY: optionalNonEmptyString,
  R2_BUCKET_NAME: optionalNonEmptyString,
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  POSTHOG_KEY: optionalNonEmptyString,
  SENTRY_DSN: optionalNonEmptyString,
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function parseServerConfig(environment: Record<string, string | undefined>): ServerConfig {
  const result = serverConfigSchema.safeParse(environment);
  if (!result.success) throw new ConfigurationError("server", result.error);
  return Object.freeze(result.data);
}
