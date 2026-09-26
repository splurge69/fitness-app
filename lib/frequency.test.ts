import { describe, expect, it } from "vitest";
import { formatHoursSince, startOfWeek } from "./frequency";

describe("startOfWeek", () => {
  it("returns Monday for a Wednesday", () => {
    const wednesday = new Date("2026-09-16T15:00:00");
    const monday = startOfWeek(wednesday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(14);
  });
});

describe("formatHoursSince", () => {
  it("reads naturally", () => {
    expect(formatHoursSince(null)).toBe("No sessions yet");
    expect(formatHoursSince(0.5)).toBe("Less than an hour ago");
    expect(formatHoursSince(5)).toBe("5 hours ago");
    expect(formatHoursSince(50)).toBe("2 days ago");
  });
});
