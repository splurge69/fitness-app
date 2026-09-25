import { Shell } from "@/components/shell";

/** Shown the instant a tab or link is tapped, while the server renders. */
export default function Loading() {
  return (
    <Shell title="Loading…">
      <div className="animate-pulse space-y-3" aria-busy="true">
        <div className="h-28 rounded-3xl bg-card" />
        <div className="h-20 rounded-3xl bg-card" />
        <div className="h-20 rounded-3xl bg-card" />
      </div>
    </Shell>
  );
}
