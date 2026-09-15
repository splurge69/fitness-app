"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  completeSession,
  createSession,
  getActiveProgramme,
  getOpenSession,
  insertSetLog,
  insertWarmupCheck,
} from "@/lib/data";
import type { Side } from "@/lib/types";

export async function startWorkoutAction(): Promise<void> {
  await requireSession();
  const open = await getOpenSession();
  if (open) {
    redirect(`/workout/${open.id}`);
  }

  const programme = await getActiveProgramme();
  if (!programme) {
    throw new Error("No active programme. Add one in the programme editor.");
  }

  const session = await createSession(programme.id);
  redirect(`/workout/${session.id}`);
}

export async function logSetAction(input: {
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string;
  exerciseName: string;
  side: Side;
  setNumber: number;
  reps: number;
  weightKg: number;
}): Promise<void> {
  await requireSession();
  await insertSetLog(input);
}

export async function checkWarmupAction(
  sessionId: string,
  programmeExerciseId: string,
): Promise<void> {
  await requireSession();
  await insertWarmupCheck(sessionId, programmeExerciseId);
}

export async function finishSessionAction(sessionId: string): Promise<void> {
  await requireSession();
  await completeSession(sessionId);
  redirect("/");
}
