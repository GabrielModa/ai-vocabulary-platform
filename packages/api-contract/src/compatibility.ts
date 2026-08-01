interface SchemaShape {
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface ComparableDocument {
  readonly paths?: Readonly<Record<string, unknown>>;
  readonly components?: { readonly schemas?: Readonly<Record<string, SchemaShape>> };
}

export function findBreakingChanges(
  baseline: ComparableDocument,
  candidate: ComparableDocument,
): readonly string[] {
  const failures: string[] = [];
  for (const path of Object.keys(baseline.paths ?? {})) {
    if (!(path in (candidate.paths ?? {}))) failures.push(`Removed path: ${path}`);
  }
  for (const [name, schema] of Object.entries(baseline.components?.schemas ?? {})) {
    const next = candidate.components?.schemas?.[name];
    if (!next) {
      failures.push(`Removed schema: ${name}`);
      continue;
    }
    for (const field of schema.required ?? []) {
      if (!(next.required ?? []).includes(field) || !(field in (next.properties ?? {}))) {
        failures.push(`Removed required field: ${name}.${field}`);
      }
    }
  }
  return failures;
}

export function lintOpenApi(document: ComparableDocument): readonly string[] {
  const failures: string[] = [];
  const operationIds = new Set<string>();
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!path.startsWith("/v1/")) failures.push(`Unversioned path: ${path}`);
    if (typeof pathItem !== "object" || pathItem === null) continue;
    for (const operation of Object.values(pathItem)) {
      if (typeof operation !== "object" || operation === null) continue;
      const operationId = (operation as Record<string, unknown>).operationId;
      if (typeof operationId !== "string" || operationId.length === 0) {
        failures.push(`Missing operationId: ${path}`);
      } else if (operationIds.has(operationId)) {
        failures.push(`Duplicate operationId: ${operationId}`);
      } else operationIds.add(operationId);
    }
  }
  return failures;
}
