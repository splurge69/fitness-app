import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export { SESSION_COOKIE } from "./auth-cookie";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function passwordsMatch(input: string, expected: string): boolean {
  const submitted = Buffer.from(input.normalize("NFKC"));
  const stored = Buffer.from(expected.normalize("NFKC"));

  if (submitted.length !== stored.length) {
    const dummy = submitted.length > 0 ? submitted : Buffer.from([0]);
    timingSafeEqual(dummy, dummy);
    return false;
  }

  return timingSafeEqual(submitted, stored);
}

export function sessionSecretBytes(secret: string): Uint8Array {
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(secret: string): Promise<string> {
  return new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(sessionSecretBytes(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    await jwtVerify(token, sessionSecretBytes(secret));
    return true;
  } catch {
    return false;
  }
}

