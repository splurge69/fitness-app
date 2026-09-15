export const SESSION_COOKIE = "fitness_session";

export function hasSessionCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => {
    const [name] = part.trim().split("=");
    return name === SESSION_COOKIE;
  });
}
