import { z } from "zod";

const adminConfigSchema = z.object({
  ADMIN_APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  ADMIN_API_URL: z.url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol)),
});

export type AdminConfig = z.infer<typeof adminConfigSchema>;

export function parseAdminConfig(
  environment: Record<string, string | undefined>,
): Readonly<AdminConfig> {
  return Object.freeze(adminConfigSchema.parse(environment));
}

export function loadAdminConfig(): Readonly<AdminConfig> {
  return parseAdminConfig({
    ADMIN_APP_ENV: process.env.ADMIN_APP_ENV,
    ADMIN_API_URL: process.env.ADMIN_API_URL,
  });
}
