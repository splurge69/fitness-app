import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import {
  getPostSessionLogs,
  getPreviousBodyWeight,
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

  const [programme, items, logs, checks, history, extras, previousWeight] = await Promise.all([
    getProgramme(session.programmeId),
    getProgrammeItems(session.programmeId),
    getSessionLogs(session.id),
    getWarmupChecks(session.id),
    getRecentExerciseLogs(),
    session.completedAt ? getPostSessionLogs([session.id]) : Promise.resolve([]),
    session.completedAt ? getPreviousBodyWeight(session.completedAt) : Promise.resolve(null),
  ]);

  return (
    <Shell title={programme?.name ?? "Session"}>
      <WorkoutClient
        postSessionLog={extras[0]}
        previousWeight={previousWeight}
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
