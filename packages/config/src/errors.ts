import type { ZodError } from "zod";

export class ConfigurationError extends Error {
  readonly issues: readonly string[];

  constructor(scope: string, error: ZodError) {
    const issues = error.issues.map((issue) => {
      const variable = issue.path.join(".") || "configuration";
      return `${variable}: ${issue.message}`;
    });
    super(`Invalid ${scope} configuration: ${issues.join("; ")}`);
    this.name = "ConfigurationError";
    this.issues = issues;
  }
}
