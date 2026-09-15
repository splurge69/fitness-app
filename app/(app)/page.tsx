import { ExerciseArt } from "@/components/exercise-art";
import { Shell } from "@/components/shell";
import { startWorkoutAction } from "@/lib/actions/sessions";
import {
  countSessionsThisWeek,
  getActiveProgramme,
  getLastCompletedSession,
  getOpenSession,
  getProgrammeItems,
} from "@/lib/data";
import { formatHoursSince, getFrequencyStatus } from "@/lib/frequency";
import { muscleFor } from "@/lib/muscles";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <SetupCard />
      </Shell>
    );
  }

  let programme;
  let openSession;
  let lastSession;
  let sessionsThisWeek;
  let items = [];

  try {
    [programme, openSession, lastSession, sessionsThisWeek] = await Promise.all([
      getActiveProgramme(),
      getOpenSession(),
      getLastCompletedSession(),
      countSessionsThisWeek(),
    ]);
    items = programme ? await getProgrammeItems(programme.id) : [];
  } catch (error) {
    console.error("Home data failed", error);
    return (
      <Shell>
        <SetupCard detail={describeSupabaseError(error)} />
      </Shell>
    );
  }
  const working = items.filter((item) => !item.isWarmup);
  const frequency = getFrequencyStatus({
    lastCompletedAt: lastSession?.completedAt
      ? new Date(lastSession.completedAt)
      : null,
    sessionsThisWeek,
    now: new Date(),
    minHoursBetween: programme?.minHoursBetweenSessions ?? 48,
    targetPerWeek: programme?.targetSessionsPerWeek ?? 2,
    minPerWeek: programme?.minSessionsPerWeek ?? 1,
  });

  return (
    <Shell>
      <section className="rounded-3xl border border-line bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          This week
        </p>
        <p className="mt-2 font-display text-3xl text-ink">
          {frequency.sessionsThisWeek} / {frequency.targetPerWeek}
        </p>
        <p className="mt-2 text-sm text-muted">
          {frequency.weeklyLabel === "done"
            ? "Target hit. Extra sessions are optional."
            : frequency.weeklyLabel === "on-track"
              ? "Minimum done. One more session would hit the target."
              : "No completed session this week yet."}
        </p>
        <p className="mt-4 text-sm text-ink">
          Last session: {formatHoursSince(frequency.hoursSinceLast)}
        </p>
        {!frequency.canTrain && frequency.nextEligibleAt ? (
          <p className="mt-2 text-sm text-accent">
            Leave 48 hours. Next eligible{" "}
            {frequency.nextEligibleAt.toLocaleString(undefined, {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-good">Enough rest. You can train.</p>
        )}
      </section>

      <form action={startWorkoutAction} className="mt-5">
        <button
          type="submit"
          className="w-full rounded-3xl bg-ink px-4 py-5 text-lg font-medium text-paper"
        >
          {openSession ? "Resume session" : "Start session"}
        </button>
      </form>

      {programme ? (
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl text-ink">{programme.name}</h2>
            <p className="text-sm text-muted">{working.length} lifts</p>
          </div>
          {programme.notes ? (
            <p className="mt-2 text-sm text-muted">{programme.notes}</p>
          ) : null}
          <ol className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-3"
              >
                <ExerciseArt
                  name={item.name}
                  exerciseId={item.exerciseId}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {item.isWarmup
                      ? "Warm-up"
                      : muscleFor(item.name, item.exerciseId) ?? "Work"}
                  </p>
                  <p className="mt-1 text-lg text-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {[
                      item.targetSets ? `${item.targetSets} sets` : null,
                      item.targetReps ? `${item.targetReps} reps` : null,
                      item.targetWeightKg ? `${item.targetWeightKg} kg` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No target set"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="mt-8 text-muted">
          No active programme yet. Run the seed SQL, then refresh.
        </p>
      )}
    </Shell>
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
