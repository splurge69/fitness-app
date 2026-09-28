"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { savePostSessionAction } from "@/lib/actions/post-session";
import {
  POST_SESSION_ACTIVITIES,
  type PostSessionLog,
} from "@/lib/post-session";

export function PostSessionForm({
  sessionId,
  log,
  previousWeight,
}: {
  sessionId: string;
  log?: PostSessionLog;
  previousWeight: number | null;
}) {
  const [result, action, pending] = useActionState(
    savePostSessionAction.bind(null, sessionId),
    {},
  );
  const [dirty, setDirty] = useState(false);
  const [weight, setWeight] = useState(() =>
    String(log ? (log.weightKg ?? "") : (previousWeight ?? 96)),
  );
  const [minutes, setMinutes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      log?.activities.map((activity) => [
        activity.kind,
        String(activity.minutes),
      ]) ?? [],
    ),
  );
  const [selected, setSelected] = useState(
    () => log?.activities.map((activity) => activity.kind) ?? [],
  );
  const saved = result.saved && !dirty;

  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-good">
        Programme complete
      </p>
      <h2 className="mt-2 font-display text-3xl text-ink">Anything else?</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Record your weigh-in, extra cardio or sauna. Everything here is
        optional.
      </p>
      <form
        action={(form) => {
          setDirty(false);
          action(form);
        }}
        onChange={() => setDirty(true)}
        onReset={(event) => event.preventDefault()}
        className="mt-5 space-y-4"
      >
        <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
          <div className="rounded-2xl bg-paper p-4">
            <label htmlFor="post-weight" className="block font-medium text-ink">
              Body weight <span className="font-normal text-muted">· kg</span>
            </label>
            <p className="mt-1 text-xs text-muted">
              {previousWeight !== null
                ? `Previous weigh-in: ${previousWeight} kg.`
                : "Starting weight: 96 kg."}{" "}
              Confirm this session’s weight, or leave blank to skip.
            </p>
            <input
              id="post-weight"
              name="weightKg"
              type="number"
              inputMode="decimal"
              min="0.1"
              max="1000"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="mt-3 min-h-14 w-full rounded-xl border border-line bg-card px-4 font-mono text-3xl text-ink"
            />
          </div>
          {POST_SESSION_ACTIVITIES.map(({ kind, name, description }) => {
            const enabled = selected.includes(kind);
            return (
              <div key={kind} className="rounded-2xl bg-paper p-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() =>
                      setSelected((current) =>
                        enabled
                          ? current.filter((item) => item !== kind)
                          : [...current, kind],
                      )
                    }
                    className="h-5 w-5 accent-electric"
                  />
                  {name}
                  <span className="ml-auto text-xs font-normal text-muted">
                    Optional
                  </span>
                </label>
                <p className="mt-1 text-xs text-muted">{description}</p>
                {enabled ? (
                  <div className="mt-3">
                    <label
                      htmlFor={`post-${kind}`}
                      className="text-sm text-muted"
                    >
                      {name} minutes
                    </label>
                    <input
                      id={`post-${kind}`}
                      name={kind}
                      type="number"
                      inputMode="decimal"
                      min="0.1"
                      max="1000"
                      step="0.1"
                      required
                      value={minutes[kind] ?? ""}
                      onChange={(event) =>
                        setMinutes((current) => ({
                          ...current,
                          [kind]: event.target.value,
                        }))
                      }
                      placeholder="Minutes"
                      className="mt-2 min-h-14 w-full rounded-xl border border-line bg-card px-4 font-mono text-2xl text-ink"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>
        {result.error ? (
          <p role="alert" className="text-sm text-accent">
            {result.error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm text-good">
            Extras saved.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-electric px-4 py-4 font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save extras"}
        </button>
        <Link
          href="/"
          aria-disabled={pending}
          onClick={(event) => {
            if (pending) event.preventDefault();
          }}
          className="block py-2 text-center text-sm text-muted underline decoration-line underline-offset-4"
        >
          {dirty || result.error
            ? "Leave without saving changes"
            : saved || log
              ? "Done — back to Today"
              : "Skip extras — back to Today"}
        </Link>
      </form>
    </section>
  );
}
