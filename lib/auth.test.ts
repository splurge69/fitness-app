import { describe, expect, it } from "vitest";
import { hasSessionCookie } from "./auth-cookie";
import {
  passwordsMatch,
  SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
} from "./auth";

const SECRET = "test-session-secret-16";

describe("passwordsMatch", () => {
  it("accepts the exact password", () => {
    expect(passwordsMatch("gym-day", "gym-day")).toBe(true);
  });

  it("rejects a wrong password of the same length", () => {
    expect(passwordsMatch("gym-nit", "gym-day")).toBe(false);
  });

  it("rejects a wrong password of a different length", () => {
    expect(passwordsMatch("nope", "gym-day")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a signed cookie token", async () => {
    const token = await signSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken(SECRET);
    expect(await verifySessionToken(token, "other-session-secret")).toBe(false);
  });
});

describe("hasSessionCookie", () => {
  it("finds the session cookie in a header", () => {
    expect(hasSessionCookie(`${SESSION_COOKIE}=abc; theme=paper`)).toBe(true);
  });

  it("ignores a similarly named cookie", () => {
    expect(hasSessionCookie("fitness_session_old=abc")).toBe(false);
  });
});
