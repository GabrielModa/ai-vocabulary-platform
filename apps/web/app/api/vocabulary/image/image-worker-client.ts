const DEFAULT_IMAGE_WORKER_URL = "http://127.0.0.1:8765";

export function imageWorkerUrl(value = process.env.IMAGE_WORKER_URL): string {
  const trimmed = value?.trim();

  return (trimmed?.length ? trimmed : DEFAULT_IMAGE_WORKER_URL).replace(/\/+$/u, "");
}

export function imageWorkerEndpoint(path: string, value = process.env.IMAGE_WORKER_URL): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${imageWorkerUrl(value)}${suffix}`;
}
