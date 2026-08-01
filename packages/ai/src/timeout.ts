import { AiCapabilityError } from "./execution.js";

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) throw new AiCapabilityError("CANCELLED");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortHandler: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AiCapabilityError("TIMEOUT"));
    }, timeoutMs);
  });
  const cancelled = new Promise<never>((_, reject) => {
    abortHandler = () => {
      reject(new AiCapabilityError("CANCELLED"));
    };
    signal?.addEventListener("abort", abortHandler, { once: true });
  });
  try {
    return await Promise.race([operation, timeout, cancelled]);
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && abortHandler) signal.removeEventListener("abort", abortHandler);
  }
}
