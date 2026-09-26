"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  addProgrammeExercise,
  createProgramme,
  moveProgrammeExercise,
  removeProgrammeExercise,
  updateExercise,
  updateProgramme,
  updateProgrammeExercise,
} from "@/lib/data";
import type { Laterality } from "@/lib/types";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length === 0 ? null : text;
}

function optionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveProgrammeItemAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!id || !exerciseId) throw new Error("Missing programme item");

  await updateExercise({
    id: exerciseId,
    name: String(formData.get("name") ?? "").trim(),
    cues: emptyToNull(formData.get("cues")),
    laterality: String(formData.get("laterality") ?? "none") as Laterality,
    tracksDuration: formData.get("tracksDuration") === "on",
  });

  await updateProgrammeExercise({
    id,
    targetSets: optionalInt(formData.get("targetSets")),
    targetReps: optionalInt(formData.get("targetReps")),
    targetWeightKg: optionalInt(formData.get("targetWeightKg")),
    notes: emptyToNull(formData.get("notes")),
    isWarmup: formData.get("isWarmup") === "on",
  });

  revalidatePath("/programme", "layout");
}

export async function addProgrammeItemAction(formData: FormData): Promise<void> {
  await requireSession();
  const programmeId = String(formData.get("programmeId") ?? "");
  if (!programmeId) throw new Error("Missing programme");

  await addProgrammeExercise({
    programmeId,
    name: String(formData.get("name") ?? "").trim(),
    cues: emptyToNull(formData.get("cues")),
    laterality: String(formData.get("laterality") ?? "none") as Laterality,
    tracksDuration: formData.get("tracksDuration") === "on",
    isWarmup: formData.get("isWarmup") === "on",
    targetSets: optionalInt(formData.get("targetSets")),
    targetReps: optionalInt(formData.get("targetReps")),
    targetWeightKg: optionalInt(formData.get("targetWeightKg")),
    notes: emptyToNull(formData.get("notes")),
  });

  revalidatePath("/programme", "layout");
}

export async function removeProgrammeItemAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing programme item");
  await removeProgrammeExercise(id);
  revalidatePath("/programme", "layout");
}

export async function moveProgrammeItemAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "") as "up" | "down";
  if (!id || (direction !== "up" && direction !== "down")) {
    throw new Error("Invalid move");
  }
  await moveProgrammeExercise(id, direction);
  revalidatePath("/programme", "layout");
}

export async function createProgrammeAction(formData: FormData): Promise<void> {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Give the programme a name");
  const programme = await createProgramme(name);
  revalidatePath("/programme");
  redirect(`/programme/${programme.id}`);
}

export async function saveProgrammeAction(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("A programme needs a name");

  await updateProgramme({
    id,
    name,
    notes: emptyToNull(formData.get("notes")),
  });

  revalidatePath("/programme", "layout");
}
