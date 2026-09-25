import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import {
  getProgramme,
  getProgrammeItems,
  getRecentExerciseLogs,
  getSession,
  getSessionLogs,
  getWarmupChecks,
} from "@/lib/data";
import { WorkoutClient } from "./workout-client";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  const [programme, items, logs, checks] = await Promise.all([
    getProgramme(session.programmeId),
    getProgrammeItems(session.programmeId),
    getSessionLogs(session.id),
    getWarmupChecks(session.id),
  ]);
  const history = await getRecentExerciseLogs(
    items.filter((item) => !item.isWarmup).map((item) => item.exerciseId),
  );

  return (
    <Shell title={programme?.name ?? "Session"}>
      <WorkoutClient
        sessionId={session.id}
        completed={Boolean(session.completedAt)}
        items={items}
        logs={logs}
        checks={checks}
        history={history}
      />
    </Shell>
  );
}
