import { ExerciseArt } from "@/components/exercise-art";
import type { ExerciseLog } from "@/lib/types";
import { formatDuration, formatLog } from "@/lib/workout";

export type TimedWarmup = {
  name: string;
  exerciseId: string;
  durationSeconds: number;
};

export function SessionLogList({
  logs,
  warmups = [],
  empty = "Nothing logged yet.",
}: {
  logs: ExerciseLog[];
  warmups?: TimedWarmup[];
  empty?: string;
}) {
  if (logs.length === 0 && warmups.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <ol className="space-y-3">
      {warmups.map((warmup) => (
        <Row
          key={warmup.exerciseId}
          name={warmup.name}
          exerciseId={warmup.exerciseId}
          detail={formatDuration(warmup.durationSeconds)}
        />
      ))}
      {logs.map((log) => (
        <Row
          key={log.id}
          name={log.exerciseNameSnapshot}
          exerciseId={log.exerciseId}
          detail={formatLog(log)}
        />
      ))}
    </ol>
  );
}

function Row({
  name,
  exerciseId,
  detail,
}: {
  name: string;
  exerciseId: string;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <ExerciseArt name={name} exerciseId={exerciseId} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-0.5 font-mono text-sm text-muted">{detail}</p>
      </div>
    </li>
  );
}
