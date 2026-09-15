import { describe, expect, it } from "vitest";
import type { ProgrammeExercise, SetLog } from "./types";
import {
  formatKg,
  formatLoggedSet,
  getWorkoutStep,
  lastRepsForExercise,
  lastWeightForExercise,
  logsForItem,
  nextSetNumber,
  nextWorkItem,
  summariseLogs,
} from "./workout";

function item(
  overrides: Partial<ProgrammeExercise> & Pick<ProgrammeExercise, "id" | "name">,
): ProgrammeExercise {
  return {
    programmeId: "p1",
    exerciseId: overrides.exerciseId ?? overrides.id,
    cues: null,
    laterality: "none",
    isWarmup: false,
    sortOrder: 10,
    targetSets: 3,
    targetReps: 8,
    targetWeightKg: null,
    notes: null,
    ...overrides,
  };
}

function log(overrides: Partial<SetLog> & Pick<SetLog, "id">): SetLog {
  return {
    sessionId: "s1",
    exerciseId: "ex",
    programmeExerciseId: "e1",
    exerciseNameSnapshot: "Lift",
    side: "none",
    setNumber: 1,
    reps: 8,
    weightKg: 20,
    completedAt: "2026-09-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("getWorkoutStep", () => {
  const warmup = item({
    id: "w1",
    name: "Bike",
    isWarmup: true,
    sortOrder: 10,
    laterality: "none",
    targetSets: null,
  });
  const squat = item({
    id: "e1",
    exerciseId: "ex-squat",
    name: "Bulgarian split squat",
    laterality: "bilateral",
    sortOrder: 20,
    targetSets: 2,
  });

  it("starts on the first incomplete warmup", () => {
    expect(getWorkoutStep([warmup, squat], [], [])).toEqual({
      kind: "warmup",
      item: warmup,
    });
  });

  it("moves to the left side of a bilateral lift after warmup", () => {
    const step = getWorkoutStep(
      [warmup, squat],
      [],
      [{ programmeExerciseId: "w1" }],
    );
    expect(step).toMatchObject({
      kind: "work",
      item: squat,
      side: "left",
      setNumber: 1,
    });
  });

  it("advances to the right side after left sets are done", () => {
    const logs: Pick<SetLog, "programmeExerciseId" | "side">[] = [
      { programmeExerciseId: "e1", side: "left" },
      { programmeExerciseId: "e1", side: "left" },
    ];
    const step = getWorkoutStep([warmup, squat], logs, [
      { programmeExerciseId: "w1" },
    ]);
    expect(step).toMatchObject({
      kind: "work",
      side: "right",
      setNumber: 1,
    });
  });

  it("is complete when warmup and both sides are done", () => {
    const logs: Pick<SetLog, "programmeExerciseId" | "side">[] = [
      { programmeExerciseId: "e1", side: "left" },
      { programmeExerciseId: "e1", side: "left" },
      { programmeExerciseId: "e1", side: "right" },
      { programmeExerciseId: "e1", side: "right" },
    ];
    expect(
      getWorkoutStep([warmup, squat], logs, [{ programmeExerciseId: "w1" }]),
    ).toEqual({ kind: "complete" });
  });
});

describe("lastWeightForExercise", () => {
  const logs = [
    {
      exerciseId: "ext",
      side: "left" as const,
      weightKg: 20,
      completedAt: "2026-09-01T10:00:00.000Z",
    },
    {
      exerciseId: "ext",
      side: "right" as const,
      weightKg: 23,
      completedAt: "2026-09-01T10:05:00.000Z",
    },
    {
      exerciseId: "curl",
      side: "left" as const,
      weightKg: 7.5,
      completedAt: "2026-09-01T10:10:00.000Z",
    },
  ];

  it("prefills the newest weight for the same side", () => {
    expect(lastWeightForExercise(logs, "ext", "right")).toBe(23);
    expect(lastWeightForExercise(logs, "ext", "left")).toBe(20);
  });

  it("falls back to any side when that side has no history", () => {
    expect(lastWeightForExercise(logs, "curl", "right")).toBe(7.5);
  });

  it("returns null when the exercise has never been logged", () => {
    expect(lastWeightForExercise(logs, "calf", "none")).toBeNull();
  });
});

describe("session logging helpers", () => {
  const squat = item({
    id: "e1",
    exerciseId: "ex-squat",
    name: "Bulgarian split squat",
    laterality: "bilateral",
    sortOrder: 20,
  });
  const curl = item({
    id: "e2",
    exerciseId: "ex-curl",
    name: "Hamstring curl",
    sortOrder: 30,
  });

  it("lists logs for one programme item and side", () => {
    const logs = [
      log({ id: "1", programmeExerciseId: "e1", side: "left", setNumber: 1 }),
      log({ id: "2", programmeExerciseId: "e1", side: "right", setNumber: 1 }),
      log({ id: "3", programmeExerciseId: "e2", side: "none", setNumber: 1 }),
    ];
    expect(logsForItem(logs, "e1").map((entry) => entry.id)).toEqual(["1", "2"]);
    expect(logsForItem(logs, "e1", "left").map((entry) => entry.id)).toEqual(["1"]);
  });

  it("uses the next set number after a deleted middle set", () => {
    expect(nextSetNumber([], "e1", "left")).toBe(1);
    expect(
      nextSetNumber(
        [
          { programmeExerciseId: "e1", side: "left", setNumber: 1 },
          { programmeExerciseId: "e1", side: "left", setNumber: 3 },
        ],
        "e1",
        "left",
      ),
    ).toBe(4);
  });

  it("moves to the next working lift, then stops", () => {
    expect(nextWorkItem([squat, curl], "e1")?.id).toBe("e2");
    expect(nextWorkItem([squat, curl], "e2")).toBeNull();
  });

  it("summarises every actual set, not only the last one", () => {
    expect(formatKg(20)).toBe("20");
    expect(formatKg(22.5)).toBe("22.5");
    expect(
      formatLoggedSet({ side: "left", weightKg: 22.5, reps: 8 }),
    ).toBe("L 22.5 kg × 8");
    expect(
      summariseLogs([
        log({
          id: "1",
          exerciseNameSnapshot: "Split squat",
          side: "left",
          weightKg: 20,
          reps: 8,
        }),
        log({
          id: "2",
          exerciseNameSnapshot: "Split squat",
          side: "left",
          weightKg: 22.5,
          reps: 6,
        }),
      ]),
    ).toEqual(["Split squat: L 20 kg × 8, L 22.5 kg × 6"]);
  });
});

describe("lastRepsForExercise", () => {
  it("returns the newest matching reps", () => {
    expect(
      lastRepsForExercise(
        [
          {
            exerciseId: "ext",
            side: "none",
            reps: 8,
            completedAt: "2026-09-01T10:00:00.000Z",
          },
          {
            exerciseId: "ext",
            side: "none",
            reps: 10,
            completedAt: "2026-09-08T10:00:00.000Z",
          },
        ],
        "ext",
        "none",
      ),
    ).toBe(10);
  });
});
