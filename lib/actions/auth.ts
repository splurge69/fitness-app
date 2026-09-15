"use server";

import { redirect } from "next/navigation";
import { passwordsMatch } from "@/lib/auth";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return { error: "APP_PASSWORD is not set in the environment." };
  }
  if (!passwordsMatch(password, expected)) {
    return { error: "That password is not right." };
  }

  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (!sessionSecret || sessionSecret.length < 16) {
    return {
      error:
        "SESSION_SECRET is missing in Vercel. Add a long random value (openssl rand -base64 32) for Production, then redeploy.",
    };
  }

  await createSessionCookie();
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
