import { describe, expect, it } from "vitest";
import type { ProgrammeExercise, SetLog } from "./types";
import {
  getWorkoutStep,
  lastRepsForExercise,
  lastWeightForExercise,
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
