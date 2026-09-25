import Link from "next/link";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { HistoryCalendar } from "@/components/history-calendar";
import { SessionLogList, type TimedWarmup } from "@/components/session-log-list";
import { Shell } from "@/components/shell";
import { parseYearMonth, sessionDateKey, sessionsInMonth } from "@/lib/calendar";
import {
  getAllSessions,
  getExerciseLogsForSessions,
  getProgrammeItems,
  getProgrammes,
  getWarmupChecksForSessions,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import type { ExerciseLog, ProgrammeExercise, Session, WarmupCheck } from "@/lib/types";

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

  let sessions: Session[];
  let visible: Session[];
  let programmeNames: Map<string, string>;
  let logs: ExerciseLog[];
  let checks: WarmupCheck[];
  let items: ProgrammeExercise[];
  try {
    const [allSessions, programmes] = await Promise.all([
      getAllSessions(),
      getProgrammes(),
    ]);
    sessions = allSessions;
    programmeNames = new Map(programmes.map((p) => [p.id, p.name]));
    visible = selectedDay
      ? sessions.filter((session) => sessionDateKey(session) === selectedDay)
      : sessionsInMonth(sessions, month);
    const ids = visible.map((session) => session.id);
    const programmeIds = [...new Set(visible.map((s) => s.programmeId))];
    const [logRows, checkRows, itemLists] = await Promise.all([
      getExerciseLogsForSessions(ids),
      getWarmupChecksForSessions(ids),
      Promise.all(programmeIds.map((id) => getProgrammeItems(id))),
    ]);
    logs = logRows;
    checks = checkRows;
    items = itemLists.flat();
  } catch (error) {
    return (
      <Shell title="History">
        <p className="text-muted">{describeSupabaseError(error)}</p>
      </Shell>
    );
  }

  const itemById = new Map(items.map((item) => [item.id, item]));

  return (
    <Shell title="History">
      <HistoryCalendar
        month={month}
        selectedDay={selectedDay}
        sessions={sessions}
      />

      {visible.length === 0 ? (
        <p className="text-muted">
          {selectedDay
            ? "No sessions on this day."
            : "No sessions in this month yet."}
        </p>
      ) : (
        <ol className="space-y-3">
          {visible.map((session) => {
            const sessionLogs = logs.filter((log) => log.sessionId === session.id);
            const warmups: TimedWarmup[] = checks.flatMap((check) => {
              const item = itemById.get(check.programmeExerciseId);
              if (check.sessionId !== session.id || !item || check.durationSeconds === null) {
                return [];
              }
              return [
                {
                  name: item.name,
                  exerciseId: item.exerciseId,
                  durationSeconds: check.durationSeconds,
                },
              ];
            });
            return (
              <li key={session.id}>
                <details className="group rounded-3xl border border-line bg-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block text-lg font-medium text-ink">
                        {programmeNames.get(session.programmeId) ?? "Session"}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {new Date(
                          session.completedAt ?? session.startedAt,
                        ).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {sessionLogs.length}{" "}
                        {sessionLogs.length === 1 ? "exercise" : "exercises"}
                        {session.completedAt ? "" : " · in progress"}
                      </span>
                    </span>
                    <span
                      className="text-xl text-muted transition-transform group-open:rotate-90"
                      aria-hidden
                    >
                      ›
                    </span>
                  </summary>
                  <div className="border-t border-line px-5 pt-4 pb-5">
                    <SessionLogList
                      logs={sessionLogs}
                      warmups={warmups}
                      empty="Nothing logged."
                    />
                    <div className="mt-4 flex items-center gap-4">
                      <Link
                        href={`/workout/${session.id}`}
                        className="text-sm text-ink underline decoration-line underline-offset-4"
                      >
                        Open session
                      </Link>
                      <DeleteSessionButton sessionId={session.id} />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </Shell>
  );
}
