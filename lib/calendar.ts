import type { Session } from "./types";

export type YearMonth = {
  year: number;
  month: number;
};

export type CalendarDay = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function weekdayLabels(): readonly string[] {
  return WEEKDAYS;
}

export function parseYearMonth(
  value: string | undefined,
  now = new Date(),
): YearMonth {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth(current: YearMonth, delta: number): YearMonth {
  const date = new Date(current.year, current.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthTitle({ year, month }: YearMonth): string {
  return new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function sessionDateKey(session: Session): string {
  return dateKey(new Date(session.completedAt ?? session.startedAt));
}

export function todayKey(now = new Date()): string {
  return dateKey(now);
}

export function buildMonthGrid(
  { year, month }: YearMonth,
  now = new Date(),
): CalendarDay[] {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  const today = todayKey(now);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      isToday: key === today,
    };
  });
}

export function groupSessionsByDay(sessions: Session[]): Map<string, Session[]> {
  const groups = new Map<string, Session[]>();
  for (const session of sessions) {
    const key = sessionDateKey(session);
    const current = groups.get(key) ?? [];
    current.push(session);
    groups.set(key, current);
  }
  return groups;
}

export function sessionsInMonth(
  sessions: Session[],
  { year, month }: YearMonth,
): Session[] {
  const prefix = formatYearMonth({ year, month });
  return sessions.filter((session) => sessionDateKey(session).startsWith(prefix));
}
