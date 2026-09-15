import type { SetLog } from "@/lib/types";
import { formatLoggedSet, groupLogsByName } from "@/lib/workout";

export function SessionLogList({
  logs,
  empty = "No working sets logged yet.",
}: {
  logs: SetLog[];
  empty?: string;
}) {
  const groups = groupLogsByName(logs);

  if (groups.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <ol className="space-y-3">
      {groups.map((group) => (
        <li key={group.name}>
          <p className="text-sm font-medium text-ink">{group.name}</p>
          <ul className="mt-1 space-y-1 font-mono text-sm text-muted">
            {group.sets.map((set, index) => (
              <li key={set.id}>
                {index + 1}. {formatLoggedSet(set)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
