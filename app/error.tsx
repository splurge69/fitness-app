"use client";

import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="chrome font-display text-4xl uppercase italic">Something broke</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        {error.message.includes("Server Action")
          ? "The app was just redeployed. Reload to get a fresh login form."
          : error.message || "A server error occurred."}
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted">Digest {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-6 rounded-2xl bg-electric px-4 py-3 text-sm font-medium text-accent-ink"
      >
        Reload login
      </button>
    </main>
  );
}
