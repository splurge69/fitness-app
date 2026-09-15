import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import {
  getProgrammeItems,
  getRecentSetLogs,
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

  const [items, logs, checks, history] = await Promise.all([
    getProgrammeItems(session.programmeId),
    getSessionLogs(session.id),
    getWarmupChecks(session.id),
    getRecentSetLogs(),
  ]);

  return (
    <Shell title={session.completedAt ? "Session done" : "Session"}>
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
