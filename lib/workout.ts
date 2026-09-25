import type { ExerciseLog, ProgrammeExercise, WarmupCheck } from "./types";

export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_TARGET_REPS = 8;

export type WorkoutPhase =
  | { kind: "warmup"; item: ProgrammeExercise }
  | { kind: "work"; item: ProgrammeExercise }
  | { kind: "complete" };

export type LogEntry = { weightKg: number; reps: number; sets: number };

export function workItemsOf(items: ProgrammeExercise[]): ProgrammeExercise[] {
  return [...items]
    .filter((item) => !item.isWarmup)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isWarmupDone(
  checks: Pick<WarmupCheck, "programmeExerciseId">[],
  itemId: string,
): boolean {
  return checks.some((check) => check.programmeExerciseId === itemId);
}

export function logFor<T extends Pick<ExerciseLog, "exerciseId">>(
  logs: T[],
  item: Pick<ProgrammeExercise, "exerciseId">,
): T | null {
  return logs.find((log) => log.exerciseId === item.exerciseId) ?? null;
}

export function getWorkoutStep(
  items: ProgrammeExercise[],
  logs: Pick<ExerciseLog, "exerciseId">[],
  checks: Pick<WarmupCheck, "programmeExerciseId">[],
): WorkoutPhase {
  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const nextWarmup = ordered.find(
    (item) => item.isWarmup && !isWarmupDone(checks, item.id),
  );
  if (nextWarmup) return { kind: "warmup", item: nextWarmup };

  const nextWork = workItemsOf(ordered).find((item) => !logFor(logs, item));
  if (nextWork) return { kind: "work", item: nextWork };

  return { kind: "complete" };
}

/** The next lift in programme order that is not logged yet, after `currentId`. */
export function nextWorkItem(
  items: ProgrammeExercise[],
  logs: Pick<ExerciseLog, "exerciseId">[],
  currentId: string,
): ProgrammeExercise | null {
  const work = workItemsOf(items);
  const index = work.findIndex((item) => item.id === currentId);
  const rotated = [...work.slice(index + 1), ...work.slice(0, Math.max(index, 0))];
  return rotated.find((item) => !logFor(logs, item)) ?? null;
}

/** The most recent log for this exercise from any other session. */
export function lastLogForExercise(
  history: ExerciseLog[],
  exerciseId: string,
  currentSessionId: string,
): ExerciseLog | null {
  return (
    history
      .filter(
        (log) => log.exerciseId === exerciseId && log.sessionId !== currentSessionId,
      )
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] ?? null
  );
}

/** What to prefill: this session's log, else last time, else the programme target. */
export function suggestedEntry(
  item: ProgrammeExercise,
  current: LogEntry | null,
  previous: LogEntry | null,
): LogEntry {
  if (current) return { ...current };
  return {
    weightKg: previous?.weightKg ?? item.targetWeightKg ?? 0,
    reps: previous?.reps ?? item.targetReps ?? DEFAULT_TARGET_REPS,
    sets: previous?.sets ?? item.targetSets ?? DEFAULT_TARGET_SETS,
  };
}

export function formatKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatLog(log: LogEntry): string {
  return `${formatKg(log.weightKg)} kg × ${log.reps} × ${log.sets} ${
    log.sets === 1 ? "set" : "sets"
  }`;
}

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (rest === 0) return `${minutes} min`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

export function prescriptionFor(item: ProgrammeExercise): string {
  const sets = item.targetSets ?? DEFAULT_TARGET_SETS;
  return [
    `${sets} ${sets === 1 ? "set" : "sets"}`,
    item.targetReps ? `${item.targetReps} reps` : null,
    item.targetWeightKg ? `${formatKg(item.targetWeightKg)} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
