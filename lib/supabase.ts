import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Supabase swaps secret API keys for a short-lived JWT at its gateway. When the
 * database's clock is a moment behind, PostgREST rejects that token with "JWT
 * issued at future". It clears within a second, so retry instead of failing.
 */
export const fetchWithClockSkewRetry: typeof fetch = async (input, init) => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (response.status !== 401 || attempt >= 3) return response;
    const body = await response.clone().text();
    if (!body.includes("JWT issued at future")) return response;
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
};

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: { fetch: fetchWithClockSkewRetry },
  });
  return client;
}
