"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-4 text-lg text-ink outline-none focus:border-accent"
        />
      </label>
      {state?.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-electric px-4 py-4 font-display text-xl uppercase tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "Checking…" : "Let’s go"}
      </button>
    </form>
  );
}
