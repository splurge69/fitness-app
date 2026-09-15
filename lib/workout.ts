import type { ProgrammeExercise, SetLog, Side, WarmupCheck } from "./types";

export const DEFAULT_TARGET_SETS = 3;

export type WorkoutPhase =
  | { kind: "warmup"; item: ProgrammeExercise }
  | { kind: "work"; item: ProgrammeExercise; side: Side; setNumber: number }
  | { kind: "complete" };

export function targetSetsFor(item: ProgrammeExercise): number {
  return item.targetSets ?? DEFAULT_TARGET_SETS;
}

export function sidesFor(item: ProgrammeExercise): Side[] {
  return item.laterality === "bilateral" ? ["left", "right"] : ["none"];
}

export function setsLoggedFor(
  logs: Pick<SetLog, "programmeExerciseId" | "side">[],
  itemId: string,
  side: Side,
): number {
  return logs.filter(
    (log) => log.programmeExerciseId === itemId && log.side === side,
  ).length;
}

export function isWarmupDone(
  checks: Pick<WarmupCheck, "programmeExerciseId">[],
  itemId: string,
): boolean {
  return checks.some((check) => check.programmeExerciseId === itemId);
}

export function isExerciseComplete(
  item: ProgrammeExercise,
  logs: Pick<SetLog, "programmeExerciseId" | "side">[],
): boolean {
  return sidesFor(item).every(
    (side) => setsLoggedFor(logs, item.id, side) >= targetSetsFor(item),
  );
}

export function getWorkoutStep(
  items: ProgrammeExercise[],
  logs: Pick<SetLog, "programmeExerciseId" | "side">[],
  checks: Pick<WarmupCheck, "programmeExerciseId">[],
): WorkoutPhase {
  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const nextWarmup = ordered.find(
    (item) => item.isWarmup && !isWarmupDone(checks, item.id),
  );
  if (nextWarmup) {
    return { kind: "warmup", item: nextWarmup };
  }

  for (const item of ordered.filter((entry) => !entry.isWarmup)) {
    if (isExerciseComplete(item, logs)) continue;
    for (const side of sidesFor(item)) {
      const done = setsLoggedFor(logs, item.id, side);
      if (done < targetSetsFor(item)) {
        return {
          kind: "work",
          item,
          side,
          setNumber: done + 1,
        };
      }
    }
  }

  return { kind: "complete" };
}

export function lastWeightForExercise(
  logs: Array<{ exerciseId: string; side: Side; weightKg: number; completedAt: string }>,
  exerciseId: string,
  side: Side,
): number | null {
  const chronological = [...logs].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
  const newestFirst = chronological.reverse();
  const sameSide = newestFirst.find(
    (log) => log.exerciseId === exerciseId && log.side === side,
  );
  if (sameSide) return sameSide.weightKg;
  const any = newestFirst.find((log) => log.exerciseId === exerciseId);
  return any?.weightKg ?? null;
}

export function lastRepsForExercise(
  logs: Array<{ exerciseId: string; side: Side; reps: number; completedAt: string }>,
  exerciseId: string,
  side: Side,
): number | null {
  const chronological = [...logs].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
  const newestFirst = chronological.reverse();
  const sameSide = newestFirst.find(
    (log) => log.exerciseId === exerciseId && log.side === side,
  );
  if (sameSide) return sameSide.reps;
  const any = newestFirst.find((log) => log.exerciseId === exerciseId);
  return any?.reps ?? null;
}

