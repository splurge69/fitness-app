import Link from "next/link";
import { Shell } from "@/components/shell";
import { getCompletedSessions, getSessionLogs } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";

export default async function HistoryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell title="History">
        <p className="text-muted">Connect Supabase to see past sessions.</p>
      </Shell>
    );
  }

  let sessions;
  try {
    sessions = await getCompletedSessions();
  } catch (error) {
    return (
      <Shell title="History">
        <p className="text-muted">{describeSupabaseError(error)}</p>
      </Shell>
    );
  }
  const recent = await Promise.all(
    sessions.slice(0, 8).map(async (session) => ({
      session,
      logs: await getSessionLogs(session.id),
    })),
  );

  return (
    <Shell title="History">
      {recent.length === 0 ? (
        <p className="text-muted">No completed sessions yet.</p>
      ) : (
        <ol className="space-y-4">
          {recent.map(({ session, logs }) => (
            <li
              key={session.id}
              className="rounded-3xl border border-line bg-card p-5"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {new Date(session.completedAt ?? session.startedAt).toLocaleString(
                  undefined,
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </p>
              <p className="mt-1 text-lg text-ink">
                {logs.length} sets · {new Set(logs.map((log) => log.exerciseNameSnapshot)).size}{" "}
                exercises
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {summarise(logs).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link
                href={`/workout/${session.id}`}
                className="mt-4 inline-block text-sm text-ink underline decoration-line underline-offset-4"
              >
                Open session
              </Link>
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
      sides.has("left") || sides.has("right") ? "both sides" : `${sets.length} sets`;
    return `${name}: ${last.weightKg} kg × ${last.reps} (${sideNote})`;
  });
}
