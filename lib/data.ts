import { supabaseAdmin } from "./supabase";
import type {
  Programme,
  ProgrammeExercise,
  Session,
  SetLog,
  WarmupCheck,
} from "./types";
import { startOfWeek } from "./frequency";

type ProgrammeRow = {
  id: string;
  name: string;
  notes: string | null;
  min_hours_between_sessions: number;
  target_sessions_per_week: number;
  min_sessions_per_week: number;
  is_active: boolean;
};

type ExerciseRow = {
  id: string;
  name: string;
  cues: string | null;
  laterality: "none" | "bilateral";
};

type ProgrammeExerciseRow = {
  id: string;
  programme_id: string;
  exercise_id: string;
  sort_order: number;
  is_warmup: boolean;
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | string | null;
  notes: string | null;
  exercises: ExerciseRow | ExerciseRow[] | null;
};

type SessionRow = {
  id: string;
  programme_id: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

type SetLogRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  programme_exercise_id: string | null;
  exercise_name_snapshot: string;
  side: "left" | "right" | "none";
  set_number: number;
  reps: number;
  weight_kg: number | string;
  completed_at: string;
};

function mapProgramme(row: ProgrammeRow): Programme {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    minHoursBetweenSessions: row.min_hours_between_sessions,
    targetSessionsPerWeek: row.target_sessions_per_week,
    minSessionsPerWeek: row.min_sessions_per_week,
    isActive: row.is_active,
  };
}

function throwIfError(error: { message?: string; code?: string; hint?: string } | null) {
  if (!error) return;
  const err = new Error(
    [error.message, error.hint].filter(Boolean).join(" — ") ||
      "Supabase query failed",
  );
  Object.assign(err, { code: error.code, hint: error.hint });
  throw err;
}

function mapProgrammeExercise(
  row: Omit<ProgrammeExerciseRow, "exercises">,
  exercise: ExerciseRow,
): ProgrammeExercise {
  return {
    id: row.id,
    programmeId: row.programme_id,
    exerciseId: row.exercise_id,
    name: exercise.name,
    cues: exercise.cues,
    laterality: exercise.laterality,
    isWarmup: row.is_warmup,
    sortOrder: row.sort_order,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeightKg:
      row.target_weight_kg === null ? null : Number(row.target_weight_kg),
    notes: row.notes,
  };
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    programmeId: row.programme_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    notes: row.notes,
  };
}

function mapSetLog(row: SetLogRow): SetLog {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    programmeExerciseId: row.programme_exercise_id,
    exerciseNameSnapshot: row.exercise_name_snapshot,
    side: row.side,
    setNumber: row.set_number,
    reps: row.reps,
    weightKg: Number(row.weight_kg),
    completedAt: row.completed_at,
  };
}

export async function getActiveProgramme(): Promise<Programme | null> {
  const { data, error } = await supabaseAdmin()
    .from("programmes")
    .select(
      "id, name, notes, min_hours_between_sessions, target_sessions_per_week, min_sessions_per_week, is_active",
    )
    .eq("is_active", true)
    .maybeSingle();

  throwIfError(error);
  return data ? mapProgramme(data as ProgrammeRow) : null;
}

export async function getProgrammeItems(
  programmeId: string,
): Promise<ProgrammeExercise[]> {
  const { data, error } = await supabaseAdmin()
    .from("programme_exercises")
    .select(
      "id, programme_id, exercise_id, sort_order, is_warmup, target_sets, target_reps, target_weight_kg, notes",
    )
    .eq("programme_id", programmeId)
    .order("sort_order", { ascending: true });

  throwIfError(error);
  const rows = (data ?? []) as Omit<ProgrammeExerciseRow, "exercises">[];
  if (rows.length === 0) return [];

  const exerciseIds = [...new Set(rows.map((row) => row.exercise_id))];
  const { data: exercises, error: exerciseError } = await supabaseAdmin()
    .from("exercises")
    .select("id, name, cues, laterality")
    .in("id", exerciseIds);

  throwIfError(exerciseError);
  const byId = new Map(
    ((exercises ?? []) as ExerciseRow[]).map((exercise) => [exercise.id, exercise]),
  );

  return rows.map((row) => {
    const exercise = byId.get(row.exercise_id);
    if (!exercise) {
      throw new Error(`Exercise ${row.exercise_id} is missing from the catalogue.`);
    }
    return mapProgrammeExercise(row, exercise);
  });
}

export async function getOpenSession(): Promise<Session | null> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, programme_id, started_at, completed_at, notes")
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  return data ? mapSession(data as SessionRow) : null;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, programme_id, started_at, completed_at, notes")
    .eq("id", sessionId)
    .maybeSingle();

  throwIfError(error);
  return data ? mapSession(data as SessionRow) : null;
}

export async function getLastCompletedSession(): Promise<Session | null> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, programme_id, started_at, completed_at, notes")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  return data ? mapSession(data as SessionRow) : null;
}

export async function countSessionsThisWeek(now = new Date()): Promise<number> {
  const weekStart = startOfWeek(now).toISOString();
  const { count, error } = await supabaseAdmin()
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .not("completed_at", "is", null)
    .gte("completed_at", weekStart);

  throwIfError(error);
  return count ?? 0;
}

export async function createSession(programmeId: string): Promise<Session> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .insert({ programme_id: programmeId })
    .select("id, programme_id, started_at, completed_at, notes")
    .single();

  throwIfError(error);
  return mapSession(data as SessionRow);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  throwIfError(error);
}

export async function getAllSessions(): Promise<Session[]> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, programme_id, started_at, completed_at, notes")
    .order("started_at", { ascending: false })
    .limit(40);

  throwIfError(error);
  return ((data ?? []) as SessionRow[]).map(mapSession);
}

export async function completeSession(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  throwIfError(error);
}

export async function getSessionLogs(sessionId: string): Promise<SetLog[]> {
  const { data, error } = await supabaseAdmin()
    .from("set_logs")
    .select(
      "id, session_id, exercise_id, programme_exercise_id, exercise_name_snapshot, side, set_number, reps, weight_kg, completed_at",
    )
    .eq("session_id", sessionId)
    .order("completed_at", { ascending: true });

  throwIfError(error);
  return ((data ?? []) as SetLogRow[]).map(mapSetLog);
}

export async function getWarmupChecks(sessionId: string): Promise<WarmupCheck[]> {
  const { data, error } = await supabaseAdmin()
    .from("warmup_checks")
    .select("session_id, programme_exercise_id, completed_at")
    .eq("session_id", sessionId);

  throwIfError(error);
  return ((data ?? []) as Array<{
    session_id: string;
    programme_exercise_id: string;
    completed_at: string;
  }>).map((row) => ({
    sessionId: row.session_id,
    programmeExerciseId: row.programme_exercise_id,
    completedAt: row.completed_at,
  }));
}

export async function getRecentSetLogs(limit = 200): Promise<SetLog[]> {
  const { data, error } = await supabaseAdmin()
    .from("set_logs")
    .select(
      "id, session_id, exercise_id, programme_exercise_id, exercise_name_snapshot, side, set_number, reps, weight_kg, completed_at",
    )
    .order("completed_at", { ascending: false })
    .limit(limit);

  throwIfError(error);
  return ((data ?? []) as SetLogRow[]).map(mapSetLog);
}

export async function insertSetLog(input: {
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string;
  exerciseName: string;
  side: SetLog["side"];
  setNumber: number;
  reps: number;
  weightKg: number;
}): Promise<SetLog> {
  const { data, error } = await supabaseAdmin()
    .from("set_logs")
    .insert({
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      programme_exercise_id: input.programmeExerciseId,
      exercise_name_snapshot: input.exerciseName,
      side: input.side,
      set_number: input.setNumber,
      reps: input.reps,
      weight_kg: input.weightKg,
    })
    .select(
      "id, session_id, exercise_id, programme_exercise_id, exercise_name_snapshot, side, set_number, reps, weight_kg, completed_at",
    )
    .single();

  throwIfError(error);
  return mapSetLog(data as SetLogRow);
}

export async function insertWarmupCheck(
  sessionId: string,
  programmeExerciseId: string,
): Promise<void> {
  const { error } = await supabaseAdmin().from("warmup_checks").upsert({
    session_id: sessionId,
    programme_exercise_id: programmeExerciseId,
  });

  throwIfError(error);
}

export async function getCompletedSessions(): Promise<
  Array<Session & { setCount: number }>
> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, programme_id, started_at, completed_at, notes")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(40);

  throwIfError(error);
  const sessions = ((data ?? []) as SessionRow[]).map(mapSession);
  const ids = sessions.map((session) => session.id);
  if (ids.length === 0) return [];

  const { data: logs, error: logError } = await supabaseAdmin()
    .from("set_logs")
    .select("session_id")
    .in("session_id", ids);

  throwIfError(logError);
  const counts = new Map<string, number>();
  for (const row of (logs ?? []) as Array<{ session_id: string }>) {
    counts.set(row.session_id, (counts.get(row.session_id) ?? 0) + 1);
  }

  return sessions.map((session) => ({
    ...session,
    setCount: counts.get(session.id) ?? 0,
  }));
}

export async function getSessionHistory(sessionId: string): Promise<{
  session: Session;
  logs: SetLog[];
} | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const logs = await getSessionLogs(sessionId);
  return { session, logs };
}

export async function updateProgrammeExercise(input: {
  id: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  notes: string | null;
  isWarmup: boolean;
}): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("programme_exercises")
    .update({
      target_sets: input.targetSets,
      target_reps: input.targetReps,
      target_weight_kg: input.targetWeightKg,
      notes: input.notes,
      is_warmup: input.isWarmup,
    })
    .eq("id", input.id);

  throwIfError(error);
}

export async function updateExercise(input: {
  id: string;
  name: string;
  cues: string | null;
  laterality: "none" | "bilateral";
}): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("exercises")
    .update({
      name: input.name,
      cues: input.cues,
      laterality: input.laterality,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  throwIfError(error);
}

export async function addProgrammeExercise(input: {
  programmeId: string;
  name: string;
  cues: string | null;
  laterality: "none" | "bilateral";
  isWarmup: boolean;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  notes: string | null;
}): Promise<void> {
  const { data: last, error: lastError } = await supabaseAdmin()
    .from("programme_exercises")
    .select("sort_order")
    .eq("programme_id", input.programmeId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(lastError);
  const nextOrder = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 10;

  const { data: exercise, error: exerciseError } = await supabaseAdmin()
    .from("exercises")
    .insert({
      name: input.name,
      cues: input.cues,
      laterality: input.laterality,
    })
    .select("id")
    .single();

  throwIfError(exerciseError);

  const { error } = await supabaseAdmin().from("programme_exercises").insert({
    programme_id: input.programmeId,
    exercise_id: (exercise as { id: string }).id,
    sort_order: nextOrder,
    is_warmup: input.isWarmup,
    target_sets: input.targetSets,
    target_reps: input.targetReps,
    target_weight_kg: input.targetWeightKg,
    notes: input.notes,
  });

  throwIfError(error);
}

export async function removeProgrammeExercise(id: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("programme_exercises")
    .delete()
    .eq("id", id);

  throwIfError(error);
}

export async function moveProgrammeExercise(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const { data: current, error: currentError } = await supabaseAdmin()
    .from("programme_exercises")
    .select("id, programme_id, sort_order")
    .eq("id", id)
    .single();

  throwIfError(currentError);
  const row = current as { id: string; programme_id: string; sort_order: number };

  const { data: siblings, error: siblingError } = await supabaseAdmin()
    .from("programme_exercises")
    .select("id, sort_order")
    .eq("programme_id", row.programme_id)
    .order("sort_order", { ascending: true });

  throwIfError(siblingError);
  const list = (siblings ?? []) as Array<{ id: string; sort_order: number }>;
  const index = list.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? list[index - 1] : list[index + 1];
  if (!swapWith) return;

  const parkingOrder = -Math.abs(row.sort_order) - 1;
  const { error: parkError } = await supabaseAdmin()
    .from("programme_exercises")
    .update({ sort_order: parkingOrder })
    .eq("id", row.id);
  throwIfError(parkError);

  const { error: firstError } = await supabaseAdmin()
    .from("programme_exercises")
    .update({ sort_order: row.sort_order })
    .eq("id", swapWith.id);
  throwIfError(firstError);

  const { error: secondError } = await supabaseAdmin()
    .from("programme_exercises")
    .update({ sort_order: swapWith.sort_order })
    .eq("id", row.id);
  throwIfError(secondError);
}
