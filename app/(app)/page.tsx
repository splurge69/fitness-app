import Link from "next/link";
import { ProgrammePreview } from "@/components/programme-preview";
import { Shell } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import {
  resumeWorkoutAction,
  startWorkoutAction,
} from "@/lib/actions/sessions";
import {
  getCompletedSessions,
  getOpenSession,
  getProgrammes,
  getProgrammeItems,
} from "@/lib/data";
import { formatHoursSince, startOfWeek } from "@/lib/frequency";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import type { Programme, ProgrammeExercise, Session } from "@/lib/types";
import { upNextProgrammeId } from "@/lib/workout";

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
  let programmeItems: ProgrammeExercise[][];

  try {
    [programmes, openSession, completed] = await Promise.all([
      getProgrammes(),
      getOpenSession(),
      getCompletedSessions(),
    ]);
    programmeItems = await Promise.all(
      programmes.map((programme) => getProgrammeItems(programme.id)),
    );
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
  const upNext = upNextProgrammeId(
    programmes.map((programme) => programme.id),
    completed,
  );
  const nameOf = (id: string) =>
    programmes.find((programme) => programme.id === id)?.name ?? "Session";

  return (
    <Shell>
      <Link
        href="/history"
        className="block rounded-3xl border border-line bg-card p-5 active:border-accent"
      >
        <p className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-muted">
          This week
          <span className="text-xl text-ink" aria-hidden>
            ›
          </span>
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
      </Link>

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
            <p className="mt-3 text-sm text-muted">No programmes yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {programmes.map((programme, index) => (
                <li key={programme.id}>
                  <ProgrammeCard
                    programme={programme}
                    items={programmeItems[index]}
                    completed={completed}
                    thisWeek={thisWeek}
                    now={now}
                    upNext={programme.id === upNext}
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

function ProgrammeCard({
  programme,
  items,
  completed,
  thisWeek,
  now,
  upNext,
}: {
  programme: Programme;
  items: ProgrammeExercise[];
  completed: Session[];
  thisWeek: Session[];
  now: Date;
  upNext: boolean;
}) {
  const last = completed.find(
    (session) => session.programmeId === programme.id,
  );
  const doneThisWeek = thisWeek.filter(
    (session) => session.programmeId === programme.id,
  ).length;
  const lastDone = last?.completedAt
    ? formatHoursSince(
        (now.getTime() - new Date(last.completedAt).getTime()) / 36e5,
      )
    : "never done";

  return (
    <div
      className={`rounded-3xl border bg-card p-5 ${upNext ? "border-accent" : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium text-ink">{programme.name}</h3>
          {upNext ? (
            <span className="mt-2 inline-block rounded-sm bg-accent px-1.5 py-0.5 font-display text-xs uppercase tracking-[0.1em] text-accent-ink">
              Up next
            </span>
          ) : null}
        </div>
        <p className="shrink-0 pt-1 text-right text-xs leading-5 text-muted">
          <span className="block sm:inline">{doneThisWeek} this week</span>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">{lastDone}</span>
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <form action={startWorkoutAction.bind(null, programme.id)}>
          <SubmitButton
            pendingLabel="Starting…"
            className="min-h-12 w-full rounded-2xl bg-electric px-4 py-3 text-sm font-medium text-accent-ink"
          >
            Start<span className="sr-only"> {programme.name}</span>
          </SubmitButton>
        </form>
        <ProgrammePreview programme={programme} items={items} />
      </div>
    </div>
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
            <code className="font-mono text-ink">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            , then paste{" "}
            <code className="font-mono text-ink">supabase/setup.sql</code> into
            the Supabase SQL editor. Do not use the publishable/anon key.
          </>
        )}
      </p>
    </section>
  );
}
