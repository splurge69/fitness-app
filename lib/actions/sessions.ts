"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  completeSession,
  createSession,
  deleteExerciseLog,
  deleteSession,
  getOpenSession,
  getProgramme,
  insertWarmupCheck,
  saveExerciseLog,
} from "@/lib/data";

export async function startWorkoutAction(programmeId: string): Promise<void> {
  await requireSession();
  const open = await getOpenSession();
  if (open) {
    redirect(`/workout/${open.id}`);
  }

  const programme = await getProgramme(programmeId);
  if (!programme) {
    throw new Error("That programme no longer exists.");
  }

  const session = await createSession(programme.id);
  redirect(`/workout/${session.id}`);
}

export async function resumeWorkoutAction(): Promise<void> {
  await requireSession();
  const open = await getOpenSession();
  redirect(open ? `/workout/${open.id}` : "/");
}

function wholeNumber(value: number, min: number): number {
  if (!Number.isFinite(value)) throw new Error("Invalid number");
  return Math.max(min, Math.round(value));
}

export async function saveExerciseLogAction(input: {
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  sets: number;
}): Promise<void> {
  await requireSession();
  if (!Number.isFinite(input.weightKg) || input.weightKg < 0) {
    throw new Error("Invalid weight");
  }
  await saveExerciseLog({
    ...input,
    weightKg: Math.round(input.weightKg * 10) / 10,
    reps: wholeNumber(input.reps, 1),
    sets: wholeNumber(input.sets, 1),
  });
}

export async function deleteExerciseLogAction(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  await requireSession();
  await deleteExerciseLog(sessionId, exerciseId);
}

export async function checkWarmupAction(
  sessionId: string,
  programmeExerciseId: string,
  durationSeconds: number | null = null,
): Promise<void> {
  await requireSession();
  const duration =
    durationSeconds === null ? null : wholeNumber(durationSeconds, 0);
  await insertWarmupCheck(sessionId, programmeExerciseId, duration);
}

export async function finishSessionAction(sessionId: string): Promise<void> {
  await requireSession();
  await completeSession(sessionId);
  redirect("/");
}

export async function deleteSessionAction(sessionId: string): Promise<void> {
  await requireSession();
  await deleteSession(sessionId);
  redirect("/history");
}
