export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { configureLocalDevelopmentRuntime } =
    await import("./src/local-development-runtime-bootstrap");

  configureLocalDevelopmentRuntime();
}
