import Link from "next/link";
import type { Session } from "@/lib/types";
import {
  buildMonthGrid,
  formatYearMonth,
  groupSessionsByDay,
  monthTitle,
  sessionsInMonth,
  shiftMonth,
  weekdayLabels,
  type YearMonth,
} from "@/lib/calendar";

export function HistoryCalendar({
  month,
  selectedDay,
  sessions,
}: {
  month: YearMonth;
  selectedDay?: string;
  sessions: Session[];
}) {
  const days = buildMonthGrid(month);
  const byDay = groupSessionsByDay(sessions);
  const inMonth = sessionsInMonth(sessions, month);
  const completed = inMonth.filter((session) => session.completedAt).length;
  const previous = formatYearMonth(shiftMonth(month, -1));
  const next = formatYearMonth(shiftMonth(month, 1));
  const current = formatYearMonth(month);

  return (
    <section className="mb-6 rounded-3xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/history?month=${previous}`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-xl text-ink"
          aria-label="Previous month"
        >
          ‹
        </Link>
        <div className="text-center">
          <h2 className="font-display text-2xl text-ink">{monthTitle(month)}</h2>
          <p className="mt-1 text-sm text-muted">
            {completed} completed
            {inMonth.length - completed > 0
              ? ` · ${inMonth.length - completed} in progress`
              : ""}
          </p>
        </div>
        <Link
          href={`/history?month=${next}`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-xl text-ink"
          aria-label="Next month"
        >
          ›
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-[0.12em] text-muted">
        {weekdayLabels().map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const daySessions = byDay.get(day.key) ?? [];
          const done = daySessions.some((session) => session.completedAt);
          const open = daySessions.some((session) => !session.completedAt);
          const selected = selectedDay === day.key;
          const href = daySessions.length
            ? `/history?month=${current}&day=${day.key}`
            : `/history?month=${current}`;

          return (
            <Link
              key={day.key}
              href={href}
              aria-label={`${day.key}${daySessions.length ? `, ${daySessions.length} session${daySessions.length === 1 ? "" : "s"}` : ""}`}
              className={[
                "flex min-h-12 flex-col items-center justify-center rounded-2xl text-sm",
                day.inMonth ? "text-ink" : "text-muted/50",
                day.isToday ? "ring-1 ring-ink" : "",
                selected ? "bg-electric text-accent-ink" : "",
                !selected && done ? "bg-accent/15" : "",
                !selected && !done && open ? "bg-paper" : "",
              ].join(" ")}
            >
              <span className="font-mono">{day.day}</span>
              {daySessions.length > 0 ? (
                <span
                  className={[
                    "mt-0.5 h-1.5 w-1.5 rounded-full",
                    selected ? "bg-paper" : done ? "bg-accent" : "bg-muted",
                  ].join(" ")}
                />
              ) : (
                <span className="mt-0.5 h-1.5 w-1.5" />
              )}
            </Link>
          );
        })}
      </div>

      {selectedDay ? (
        <Link
          href={`/history?month=${current}`}
          className="mt-4 block text-center text-sm text-muted underline decoration-line underline-offset-4"
        >
          Show the whole month
        </Link>
      ) : null}
    </section>
  );
}
