import { describe, expect, it } from "vitest";
import type { ExerciseLog, ProgrammeExercise } from "./types";
import {
  formatClock,
  formatDuration,
  formatKg,
  formatLog,
  getWorkoutStep,
  lastLogForExercise,
  nextWorkItem,
  suggestedEntry,
  upNextProgrammeId,
} from "./workout";

function item(
  overrides: Partial<ProgrammeExercise> & Pick<ProgrammeExercise, "id" | "name">,
): ProgrammeExercise {
  return {
    programmeId: "p1",
    exerciseId: overrides.exerciseId ?? `ex-${overrides.id}`,
    cues: null,
    laterality: "none",
    tracksDuration: false,
    isWarmup: false,
    sortOrder: 10,
    targetSets: 3,
    targetReps: 8,
    targetWeightKg: null,
    notes: null,
    ...overrides,
  };
}

function log(overrides: Partial<ExerciseLog> & Pick<ExerciseLog, "id">): ExerciseLog {
  return {
    sessionId: "s1",
    exerciseId: "ex-e1",
    programmeExerciseId: "e1",
    exerciseNameSnapshot: "Lift",
    weightKg: 20,
    reps: 8,
    sets: 3,
    completedAt: "2026-09-15T10:00:00.000Z",
    ...overrides,
  };
}

const bike = item({ id: "w1", name: "Bike", isWarmup: true, sortOrder: 10 });
const squat = item({ id: "e1", name: "Squat", sortOrder: 20 });
const curl = item({ id: "e2", name: "Curl", sortOrder: 30 });
const calf = item({ id: "e3", name: "Calf", sortOrder: 40 });
const items = [calf, squat, bike, curl];

describe("getWorkoutStep", () => {
  it("starts with the warm-up", () => {
    expect(getWorkoutStep(items, [], [])).toEqual({ kind: "warmup", item: bike });
  });

  it("moves to the first unlogged lift once warm-ups are ticked", () => {
    const checks = [{ programmeExerciseId: "w1" }];
    expect(getWorkoutStep(items, [], checks)).toEqual({ kind: "work", item: squat });
    expect(
      getWorkoutStep(items, [{ exerciseId: "ex-e1" }], checks),
    ).toEqual({ kind: "work", item: curl });
  });

  it("is complete when every lift has a log line", () => {
    const checks = [{ programmeExerciseId: "w1" }];
    const logs = [{ exerciseId: "ex-e1" }, { exerciseId: "ex-e2" }, { exerciseId: "ex-e3" }];
    expect(getWorkoutStep(items, logs, checks)).toEqual({ kind: "complete" });
  });
});

describe("nextWorkItem", () => {
  it("skips lifts already logged and wraps round", () => {
    expect(nextWorkItem(items, [], [], "e1")?.id).toBe("e2");
    expect(nextWorkItem(items, [{ exerciseId: "ex-e2" }], [], "e1")?.id).toBe("e3");
    expect(nextWorkItem(items, [{ exerciseId: "ex-e1" }], [], "e3")?.id).toBe("e2");
  });

  it("returns null when everything else is logged", () => {
    const logs = [{ exerciseId: "ex-e2" }, { exerciseId: "ex-e3" }];
    expect(nextWorkItem(items, logs, [], "e1")).toBeNull();
  });
});

describe("timed work items", () => {
  const walk = item({ id: "t1", name: "Incline walk", sortOrder: 50, tracksDuration: true });
  const withWalk = [...items, walk];
  const warmedUp = [{ programmeExerciseId: "w1" }];
  const lifted = [{ exerciseId: "ex-e1" }, { exerciseId: "ex-e2" }, { exerciseId: "ex-e3" }];

  it("stays open until a time is logged, not a weight", () => {
    expect(getWorkoutStep(withWalk, lifted, warmedUp)).toEqual({ kind: "work", item: walk });
    expect(
      getWorkoutStep(withWalk, lifted, [...warmedUp, { programmeExerciseId: "t1" }]),
    ).toEqual({ kind: "complete" });
  });
});

describe("upNextProgrammeId", () => {
  it("picks the programme done least recently, never-done first", () => {
    const completed = [
      { programmeId: "acl", completedAt: "2026-09-25T10:00:00Z" },
      { programmeId: "tone", completedAt: "2026-09-23T10:00:00Z" },
    ];
    expect(upNextProgrammeId(["acl", "tone", "cardio"], completed)).toBe("cardio");
    expect(upNextProgrammeId(["acl", "tone"], completed)).toBe("tone");
    expect(upNextProgrammeId(["acl"], completed)).toBeNull();
  });
});

describe("lastLogForExercise", () => {
  it("returns the newest log from another session", () => {
    const history = [
      log({ id: "a", sessionId: "old", weightKg: 10, completedAt: "2026-09-01T10:00:00Z" }),
      log({ id: "b", sessionId: "older", weightKg: 8, completedAt: "2026-08-01T10:00:00Z" }),
      log({ id: "c", sessionId: "now", weightKg: 12, completedAt: "2026-09-20T10:00:00Z" }),
    ];
    expect(lastLogForExercise(history, "ex-e1", "now")?.id).toBe("a");
    expect(lastLogForExercise(history, "other", "now")).toBeNull();
  });
});

describe("suggestedEntry", () => {
  it("prefers this session, then last time, then the target", () => {
    const current = { weightKg: 14, reps: 6, sets: 2 };
    const previous = { weightKg: 12, reps: 8, sets: 3 };
    const target = item({ id: "e1", name: "Squat", targetWeightKg: 10, targetReps: 10, targetSets: 4 });
    expect(suggestedEntry(target, current, previous)).toEqual(current);
    expect(suggestedEntry(target, null, previous)).toEqual(previous);
    expect(suggestedEntry(target, null, null)).toEqual({ weightKg: 10, reps: 10, sets: 4 });
  });

  it("falls back to sensible defaults with no target", () => {
    const bare = item({ id: "e1", name: "Row", targetSets: null, targetReps: null });
    expect(suggestedEntry(bare, null, null)).toEqual({ weightKg: 0, reps: 8, sets: 3 });
  });
});

describe("formatting", () => {
  it("formats a log line", () => {
    expect(formatLog({ weightKg: 12, reps: 8, sets: 3 })).toBe("12 kg × 8 × 3 sets");
    expect(formatLog({ weightKg: 7.5, reps: 10, sets: 1 })).toBe("7.5 kg × 10 × 1 set");
    expect(formatKg(22.25)).toBe("22.3");
  });

  it("formats durations", () => {
    expect(formatDuration(720)).toBe("12 min");
    expect(formatDuration(750)).toBe("12:30");
    expect(formatClock(65.9)).toBe("1:05");
  });
});
