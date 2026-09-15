export function isMissingPrivilegeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : String(error);
  return (
    code === "42501" ||
    message.includes("permission denied") ||
    message.includes("GRANT SELECT")
  );
}

export function describeSupabaseError(error: unknown): string {
  if (isMissingPrivilegeError(error)) {
    return "The database key on Vercel is a publishable/anon key. Replace SUPABASE_SERVICE_ROLE_KEY with the secret service_role key from Supabase → Project Settings → API.";
  }
  if (error instanceof Error) return error.message;
  return "Could not load data from Supabase.";
}
