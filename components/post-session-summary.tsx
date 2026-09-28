import type { PostSessionLog } from "@/lib/post-session";

export function PostSessionSummary({ log }: { log?: PostSessionLog }) {
  if (!log || (log.weightKg === null && log.activities.length === 0))
    return null;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        After your programme
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        {log.weightKg !== null ? (
          <li className="flex justify-between gap-3">
            <span>Body weight</span>
            <span className="font-mono">{log.weightKg} kg</span>
          </li>
        ) : null}
        {log.activities.map((activity) => (
          <li key={activity.kind} className="flex justify-between gap-3">
            <span>{activity.name}</span>
            <span className="font-mono">{activity.minutes} min</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
