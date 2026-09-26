import { supabaseAdmin } from "./supabase";
import type {
  ExerciseLog,
  Programme,
  ProgrammeExercise,
  Session,
  WarmupCheck,
} from "./types";

type ProgrammeRow = {
  id: string;
  name: string;
  notes: string | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  cues: string | null;
  laterality: "none" | "bilateral";
  tracks_duration: boolean;
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
};

type SessionRow = {
  id: string;
  programme_id: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

type ExerciseLogRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  programme_exercise_id: string | null;
  exercise_name_snapshot: string;
  weight_kg: number | string;
  reps: number;
  sets: number;
  completed_at: string;
};

type WarmupCheckRow = {
  session_id: string;
  programme_exercise_id: string;
  duration_seconds: number | null;
  completed_at: string;
};

const PROGRAMME_COLUMNS = "id, name, notes";
const SESSION_COLUMNS = "id, programme_id, started_at, completed_at, notes";
const EXERCISE_LOG_COLUMNS =
  "id, session_id, exercise_id, programme_exercise_id, exercise_name_snapshot, weight_kg, reps, sets, completed_at";
const WARMUP_CHECK_COLUMNS =
  "session_id, programme_exercise_id, duration_seconds, completed_at";

function mapProgramme(row: ProgrammeRow): Programme {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
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
  row: ProgrammeExerciseRow,
  exercise: ExerciseRow,
): ProgrammeExercise {
  return {
    id: row.id,
    programmeId: row.programme_id,
    exerciseId: row.exercise_id,
    name: exercise.name,
    cues: exercise.cues,
    laterality: exercise.laterality,
    tracksDuration: exercise.tracks_duration,
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

function mapExerciseLog(row: ExerciseLogRow): ExerciseLog {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    programmeExerciseId: row.programme_exercise_id,
    exerciseNameSnapshot: row.exercise_name_snapshot,
    weightKg: Number(row.weight_kg),
    reps: row.reps,
    sets: row.sets,
    completedAt: row.completed_at,
  };
}

function mapWarmupCheck(row: WarmupCheckRow): WarmupCheck {
  return {
    sessionId: row.session_id,
    programmeExerciseId: row.programme_exercise_id,
    durationSeconds: row.duration_seconds,
    completedAt: row.completed_at,
  };
}

/** Current programmes. Pass `includeArchived` to name old sessions in History. */
export async function getProgrammes(
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<Programme[]> {
  let query = supabaseAdmin()
    .from("programmes")
    .select(PROGRAMME_COLUMNS)
    .order("created_at", { ascending: true });
  if (!includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;

  throwIfError(error);
  return ((data ?? []) as ProgrammeRow[]).map(mapProgramme);
}

export async function getProgramme(programmeId: string): Promise<Programme | null> {
  const { data, error } = await supabaseAdmin()
    .from("programmes")
    .select(PROGRAMME_COLUMNS)
    .eq("id", programmeId)
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
      "id, programme_id, exercise_id, sort_order, is_warmup, target_sets, target_reps, target_weight_kg, notes, exercises(id, name, cues, laterality, tracks_duration)",
    )
    .eq("programme_id", programmeId)
    .order("sort_order", { ascending: true });

  throwIfError(error);
  const rows = (data ?? []) as unknown as Array<
    ProgrammeExerciseRow & { exercises: ExerciseRow | ExerciseRow[] | null }
  >;

  return rows.map((row) => {
    const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
    if (!exercise) {
      throw new Error(`Exercise ${row.exercise_id} is missing from the catalogue.`);
    }
    return mapProgrammeExercise(row, exercise);
  });
}

export async function getOpenSession(): Promise<Session | null> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select(SESSION_COLUMNS)
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
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();

  throwIfError(error);
  return data ? mapSession(data as SessionRow) : null;
}

/** Completed sessions, newest first. */
export async function getCompletedSessions(limit = 60): Promise<Session[]> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select(SESSION_COLUMNS)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);

  throwIfError(error);
  return ((data ?? []) as SessionRow[]).map(mapSession);
}

export async function createSession(programmeId: string): Promise<Session> {
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .insert({ programme_id: programmeId })
    .select(SESSION_COLUMNS)
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
    .select(SESSION_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(200);

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

export async function getExerciseLogsForSessions(
  sessionIds: string[],
): Promise<ExerciseLog[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabaseAdmin()
    .from("exercise_logs")
    .select(EXERCISE_LOG_COLUMNS)
    .in("session_id", sessionIds)
    .order("completed_at", { ascending: true });

  throwIfError(error);
  return ((data ?? []) as ExerciseLogRow[]).map(mapExerciseLog);
}

export async function getSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
  return getExerciseLogsForSessions([sessionId]);
}

export async function getWarmupChecksForSessions(
  sessionIds: string[],
): Promise<WarmupCheck[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabaseAdmin()
    .from("warmup_checks")
    .select(WARMUP_CHECK_COLUMNS)
    .in("session_id", sessionIds);

  throwIfError(error);
  return ((data ?? []) as WarmupCheckRow[]).map(mapWarmupCheck);
}

export async function getWarmupChecks(sessionId: string): Promise<WarmupCheck[]> {
  return getWarmupChecksForSessions([sessionId]);
}

/** The most recent exercise logs, newest first. Used to prefill and show last time. */
export async function getRecentExerciseLogs(limit = 300): Promise<ExerciseLog[]> {
  const { data, error } = await supabaseAdmin()
    .from("exercise_logs")
    .select(EXERCISE_LOG_COLUMNS)
    .order("completed_at", { ascending: false })
    .limit(limit);

  throwIfError(error);
  return ((data ?? []) as ExerciseLogRow[]).map(mapExerciseLog);
}

export async function saveExerciseLog(input: {
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  sets: number;
}): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("exercise_logs")
    .upsert(
      {
        session_id: input.sessionId,
        exercise_id: input.exerciseId,
        programme_exercise_id: input.programmeExerciseId,
        exercise_name_snapshot: input.exerciseName,
        weight_kg: input.weightKg,
        reps: input.reps,
        sets: input.sets,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "session_id,exercise_id" },
    );

  throwIfError(error);
}

export async function deleteExerciseLog(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("exercise_logs")
    .delete()
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId);

  throwIfError(error);
}

export async function deleteWarmupCheck(
  sessionId: string,
  programmeExerciseId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("warmup_checks")
    .delete()
    .eq("session_id", sessionId)
    .eq("programme_exercise_id", programmeExerciseId);

  throwIfError(error);
}

export async function insertWarmupCheck(
  sessionId: string,
  programmeExerciseId: string,
  durationSeconds: number | null,
): Promise<void> {
  const { error } = await supabaseAdmin().from("warmup_checks").upsert({
    session_id: sessionId,
    programme_exercise_id: programmeExerciseId,
    duration_seconds: durationSeconds,
  });

  throwIfError(error);
}
