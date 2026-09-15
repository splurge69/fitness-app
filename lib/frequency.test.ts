import { describe, expect, it } from "vitest";
import { getFrequencyStatus, startOfWeek } from "./frequency";

describe("startOfWeek", () => {
  it("returns Monday for a Wednesday", () => {
    const wednesday = new Date("2026-09-16T15:00:00");
    const monday = startOfWeek(wednesday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(14);
  });
});

describe("getFrequencyStatus", () => {
  const now = new Date("2026-09-16T12:00:00.000Z");

  it("allows training when there is no previous session", () => {
    const status = getFrequencyStatus({
      lastCompletedAt: null,
      sessionsThisWeek: 0,
      now,
      minHoursBetween: 48,
      targetPerWeek: 2,
      minPerWeek: 1,
    });
    expect(status.canTrain).toBe(true);
    expect(status.weeklyLabel).toBe("behind");
  });

  it("blocks training inside the 48-hour window", () => {
    const status = getFrequencyStatus({
      lastCompletedAt: new Date("2026-09-15T12:00:00.000Z"),
      sessionsThisWeek: 1,
      now,
      minHoursBetween: 48,
      targetPerWeek: 2,
      minPerWeek: 1,
    });
    expect(status.canTrain).toBe(false);
    expect(status.hoursSinceLast).toBe(24);
    expect(status.weeklyLabel).toBe("on-track");
  });

  it("allows training after 48 hours and marks the week done at two sessions", () => {
    const status = getFrequencyStatus({
      lastCompletedAt: new Date("2026-09-13T12:00:00.000Z"),
      sessionsThisWeek: 2,
      now,
      minHoursBetween: 48,
      targetPerWeek: 2,
      minPerWeek: 1,
    });
    expect(status.canTrain).toBe(true);
    expect(status.weeklyLabel).toBe("done");
  });
});
