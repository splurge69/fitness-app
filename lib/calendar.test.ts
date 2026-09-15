import { describe, expect, it } from "vitest";
import type { Session } from "./types";
import {
  buildMonthGrid,
  groupSessionsByDay,
  parseYearMonth,
  sessionsInMonth,
  shiftMonth,
} from "./calendar";

function session(id: string, when: string, completed = true): Session {
  return {
    id,
    programmeId: "p1",
    startedAt: when,
    completedAt: completed ? when : null,
    notes: null,
  };
}

describe("parseYearMonth", () => {
  it("reads a year-month query", () => {
    expect(parseYearMonth("2026-09")).toEqual({ year: 2026, month: 9 });
  });

  it("falls back to the current month", () => {
    expect(parseYearMonth(undefined, new Date("2026-03-15T12:00:00"))).toEqual({
      year: 2026,
      month: 3,
    });
  });
});

describe("shiftMonth", () => {
  it("wraps from January to December", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });
});

describe("buildMonthGrid", () => {
  it("starts on Monday and marks today", () => {
    const grid = buildMonthGrid(
      { year: 2026, month: 9 },
      new Date("2026-09-15T12:00:00"),
    );
    expect(grid).toHaveLength(42);
    expect(grid[0]?.key).toBe("2026-08-31");
    expect(grid[0]?.inMonth).toBe(false);
    expect(grid[1]?.key).toBe("2026-09-01");
    expect(grid[1]?.inMonth).toBe(true);
    expect(grid.find((day) => day.key === "2026-09-15")?.isToday).toBe(true);
  });
});

describe("session grouping", () => {
  const sessions = [
    session("a", "2026-09-02T12:00:00"),
    session("b", "2026-09-02T15:00:00"),
    session("c", "2026-08-20T12:00:00"),
  ];

  it("groups two sessions on the same local day", () => {
    const groups = groupSessionsByDay(sessions);
    expect(groups.get("2026-09-02")?.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("filters a month", () => {
    expect(sessionsInMonth(sessions, { year: 2026, month: 9 }).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);
  });
});
