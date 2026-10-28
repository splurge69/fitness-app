export function describeDataError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("no such table")) {
    return "The tables are missing. Apply the D1 migrations (npx wrangler d1 migrations apply fitness-app --remote), then refresh.";
  }
  return message || "Could not load data.";
}
