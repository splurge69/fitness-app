import Link from "next/link";
import { Shell } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { resumeWorkoutAction, startWorkoutAction } from "@/lib/actions/sessions";
import { getCompletedSessions, getOpenSession, getProgrammes } from "@/lib/data";
import { formatHoursSince, startOfWeek } from "@/lib/frequency";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import type { Programme, Session } from "@/lib/types";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <SetupCard />
      </Shell>
    );
  }

  let programmes: Programme[];
  let openSession: Session | null;
  let completed: Session[];

  try {
    [programmes, openSession, completed] = await Promise.all([
      getProgrammes(),
      getOpenSession(),
      getCompletedSessions(),
    ]);
  } catch (error) {
    console.error("Home data failed", error);
    return (
      <Shell>
        <SetupCard detail={describeSupabaseError(error)} />
      </Shell>
    );
  }

  const now = new Date();
  const weekStart = startOfWeek(now).getTime();
  const thisWeek = completed.filter(
    (session) => new Date(session.completedAt!).getTime() >= weekStart,
  );
  const last = completed[0] ?? null;
  const nameOf = (id: string) =>
    programmes.find((programme) => programme.id === id)?.name ?? "Session";

  return (
    <Shell>
      <section className="rounded-3xl border border-line bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          This week
        </p>
        <p className="mt-2 font-display text-3xl text-ink">
          {thisWeek.length} {thisWeek.length === 1 ? "session" : "sessions"}
        </p>
        <p className="mt-2 text-sm text-muted">
          Last session:{" "}
          {last
            ? `${nameOf(last.programmeId)}, ${formatHoursSince(
                (now.getTime() - new Date(last.completedAt!).getTime()) / 36e5,
              ).toLowerCase()}`
            : "none yet"}
        </p>
      </section>

      {openSession ? (
        <form action={resumeWorkoutAction} className="mt-5">
          <SubmitButton
            pendingLabel="Opening…"
            className="w-full rounded-3xl bg-electric px-4 py-5 text-left text-accent-ink"
          >
            <span className="block text-lg font-medium">Resume session</span>
            <span className="mt-1 block text-sm opacity-80">
              {nameOf(openSession.programmeId)} · started{" "}
              {new Date(openSession.startedAt).toLocaleString(undefined, {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </SubmitButton>
        </form>
      ) : (
        <section className="mt-6">
          <h2 className="font-display text-2xl text-ink">Start a session</h2>
          {programmes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No programmes yet.{" "}
              <Link href="/programme" className="text-ink underline underline-offset-4">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {programmes.map((programme) => (
                <li key={programme.id}>
                  <StartButton
                    programme={programme}
                    completed={completed}
                    thisWeek={thisWeek}
                    now={now}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Shell>
  );
}

function StartButton({
  programme,
  completed,
  thisWeek,
  now,
}: {
  programme: Programme;
  completed: Session[];
  thisWeek: Session[];
  now: Date;
}) {
  const last = completed.find((session) => session.programmeId === programme.id);
  const doneThisWeek = thisWeek.filter(
    (session) => session.programmeId === programme.id,
  ).length;
  const lastDone = last?.completedAt
    ? formatHoursSince((now.getTime() - new Date(last.completedAt).getTime()) / 36e5)
    : "never done";

  return (
    <form action={startWorkoutAction.bind(null, programme.id)}>
      <SubmitButton
        pendingLabel="Starting…"
        className="w-full rounded-3xl border border-line bg-card px-5 py-4 text-left"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-lg font-medium text-ink">{programme.name}</span>
          <span className="text-2xl text-ink" aria-hidden>
            ›
          </span>
        </span>
        <span className="mt-1 block text-sm text-muted">
          {doneThisWeek} this week · {lastDone}
        </span>
      </SubmitButton>
    </form>
  );
}

function SetupCard({ detail }: { detail?: string }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="font-display text-2xl text-ink">Connect Supabase</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {detail ?? (
          <>
            The login gate is working. Add{" "}
            <code className="font-mono text-ink">SUPABASE_URL</code> and the{" "}
            <code className="font-mono text-ink">service_role</code> secret as{" "}
            <code className="font-mono text-ink">SUPABASE_SERVICE_ROLE_KEY</code>
            , then paste{" "}
            <code className="font-mono text-ink">supabase/setup.sql</code> into
            the Supabase SQL editor. Do not use the publishable/anon key.
          </>
        )}
      </p>
    </section>
  );
}
