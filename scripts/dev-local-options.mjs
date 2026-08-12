export function parseDevLocalOptions(arguments_) {
  const known = new Set(["--no-images"]);
  const unknown = arguments_.find((argument) => !known.has(argument));
  if (unknown) throw new Error(`Unknown dev:local option: ${unknown}`);
  return Object.freeze({ imagesEnabled: !arguments_.includes("--no-images") });
}
