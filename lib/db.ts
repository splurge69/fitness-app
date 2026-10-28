import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// The parts of the D1 binding this app uses
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export function db(): D1Database {
  const env = getCloudflareContext().env as unknown as { DB: D1Database };
  return env.DB;
}
