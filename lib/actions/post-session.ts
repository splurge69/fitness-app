"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { getSession, savePostSessionLog } from "@/lib/data";
import { parsePostSession } from "@/lib/post-session";

export async function savePostSessionAction(
  sessionId: string,
  _previous: { error?: string; saved?: boolean },
  form: FormData,
): Promise<{ error?: string; saved?: boolean }> {
  await requireSession();
  let values;
  try {
    values = parsePostSession(form);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Check your entries.",
    };
  }
  try {
    const session = await getSession(sessionId);
    if (!session?.completedAt)
      return { error: "Complete your programme before logging extras." };
    await savePostSessionLog(sessionId, values);
  } catch {
    return {
      error:
        "Your extras could not be saved. Your programme is already recorded. Please try again.",
    };
  }
  revalidatePath(`/workout/${sessionId}`);
  revalidatePath("/history");
  return { saved: true };
}
