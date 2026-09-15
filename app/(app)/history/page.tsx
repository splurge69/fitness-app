import Link from "next/link";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { HistoryCalendar } from "@/components/history-calendar";
import { Shell } from "@/components/shell";
import { parseYearMonth, sessionDateKey, sessionsInMonth } from "@/lib/calendar";
import { getAllSessions, getSessionLogs } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const params = await searchParams;
  const month = parseYearMonth(params.month);
  const selectedDay = params.day;

  if (!isSupabaseConfigured()) {
    return (
      <Shell title="History">
        <p className="text-muted">Connect Supabase to see past sessions.</p>
      </Shell>
    );
  }

  let sessions;
  try {
    sessions = await getAllSessions();
  } catch (error) {
    return (
      <Shell title="History">
        <p className="text-muted">{describeSupabaseError(error)}</p>
      </Shell>
    );
  }

  const visible = selectedDay
    ? sessions.filter((session) => sessionDateKey(session) === selectedDay)
    : sessionsInMonth(sessions, month);

  const listed = await Promise.all(
    visible.map(async (session) => ({
      session,
      logs: await getSessionLogs(session.id),
    })),
  );

  return (
    <Shell title="History">
      <HistoryCalendar
        month={month}
        selectedDay={selectedDay}
        sessions={sessions}
      />

      {listed.length === 0 ? (
        <p className="text-muted">
          {selectedDay
            ? "No sessions on this day."
            : "No sessions in this month yet."}
        </p>
      ) : (
        <ol className="space-y-4">
          {listed.map(({ session, logs }) => (
            <li
              key={session.id}
              className="rounded-3xl border border-line bg-card p-5"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {session.completedAt ? "Completed" : "In progress"} ·{" "}
                {new Date(
                  session.completedAt ?? session.startedAt,
                ).toLocaleString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p className="mt-1 text-lg text-ink">
                {logs.length} sets ·{" "}
                {new Set(logs.map((log) => log.exerciseNameSnapshot)).size}{" "}
                exercises
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {summarise(logs).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-4">
                <Link
                  href={`/workout/${session.id}`}
                  className="text-sm text-ink underline decoration-line underline-offset-4"
                >
                  Open session
                </Link>
                <DeleteSessionButton sessionId={session.id} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Shell>
  );
}

function summarise(logs: Awaited<ReturnType<typeof getSessionLogs>>): string[] {
  const byExercise = new Map<string, typeof logs>();
  for (const log of logs) {
    const current = byExercise.get(log.exerciseNameSnapshot) ?? [];
    current.push(log);
    byExercise.set(log.exerciseNameSnapshot, current);
  }

  return [...byExercise.entries()].map(([name, sets]) => {
    const last = sets[sets.length - 1];
    const sides = new Set(sets.map((set) => set.side));
    const sideNote =
      sides.has("left") || sides.has("right")
        ? "both sides"
        : `${sets.length} sets`;
    return `${name}: ${last.weightKg} kg × ${last.reps} (${sideNote})`;
  });
}
