import "server-only";
import { db } from "./db";
import type { PostSessionLog, PostSessionValues } from "./post-session";
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
  tracks_duration: boolean | number;
};

type ProgrammeExerciseRow = {
  id: string;
  programme_id: string;
  exercise_id: string;
  sort_order: number;
  is_warmup: boolean | number;
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

// D1 allows 100 bound values per query
const IN_CHUNK = 90;

const now = () => new Date().toISOString();

async function allInChunks<T>(
  ids: string[],
  query: (placeholders: string) => string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK);
    const { results } = await db()
      .prepare(query(chunk.map(() => "?").join(", ")))
      .bind(...chunk)
      .all<T>();
    rows.push(...results);
  }
  return rows;
}

function mapProgramme(row: ProgrammeRow): Programme {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
  };
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
    tracksDuration: Boolean(exercise.tracks_duration),
    isWarmup: Boolean(row.is_warmup),
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
  const { results } = await db()
    .prepare(
      `SELECT ${PROGRAMME_COLUMNS} FROM programmes ${
        includeArchived ? "" : "WHERE archived_at IS NULL"
      } ORDER BY created_at ASC`,
    )
    .all<ProgrammeRow>();
  return results.map(mapProgramme);
}

export async function getProgramme(programmeId: string): Promise<Programme | null> {
  const row = await db()
    .prepare(`SELECT ${PROGRAMME_COLUMNS} FROM programmes WHERE id = ?`)
    .bind(programmeId)
    .first<ProgrammeRow>();
  return row ? mapProgramme(row) : null;
}

export async function getProgrammeItems(
  programmeId: string,
): Promise<ProgrammeExercise[]> {
  const { results } = await db()
    .prepare(
      `SELECT pe.id, pe.programme_id, pe.exercise_id, pe.sort_order, pe.is_warmup, pe.target_sets,
              pe.target_reps, pe.target_weight_kg, pe.notes,
              e.id AS e_id, e.name AS e_name, e.cues AS e_cues, e.laterality AS e_laterality,
              e.tracks_duration AS e_tracks_duration
       FROM programme_exercises pe
       LEFT JOIN exercises e ON e.id = pe.exercise_id
       WHERE pe.programme_id = ?
       ORDER BY pe.sort_order ASC`,
    )
    .bind(programmeId)
    .all<
      ProgrammeExerciseRow & {
        e_id: string | null;
        e_name: string;
        e_cues: string | null;
        e_laterality: ExerciseRow["laterality"];
        e_tracks_duration: number;
      }
    >();

  return results.map((row) => {
    if (!row.e_id) {
      throw new Error(`Exercise ${row.exercise_id} is missing from the catalogue.`);
    }
    return mapProgrammeExercise(row, {
      id: row.e_id,
      name: row.e_name,
      cues: row.e_cues,
      laterality: row.e_laterality,
      tracks_duration: row.e_tracks_duration,
    });
  });
}

export async function getOpenSession(): Promise<Session | null> {
  const row = await db()
    .prepare(
      `SELECT ${SESSION_COLUMNS} FROM sessions WHERE completed_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
    )
    .first<SessionRow>();
  return row ? mapSession(row) : null;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const row = await db()
    .prepare(`SELECT ${SESSION_COLUMNS} FROM sessions WHERE id = ?`)
    .bind(sessionId)
    .first<SessionRow>();
  return row ? mapSession(row) : null;
}

/** Completed sessions, newest first. */
export async function getCompletedSessions(limit = 60): Promise<Session[]> {
  const { results } = await db()
    .prepare(
      `SELECT ${SESSION_COLUMNS} FROM sessions WHERE completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT ?`,
    )
    .bind(limit)
    .all<SessionRow>();
  return results.map(mapSession);
}

export async function createSession(programmeId: string): Promise<Session> {
  const session: SessionRow = {
    id: crypto.randomUUID(),
    programme_id: programmeId,
    started_at: now(),
    completed_at: null,
    notes: null,
  };
  await db()
    .prepare("INSERT INTO sessions (id, programme_id, started_at) VALUES (?, ?, ?)")
    .bind(session.id, session.programme_id, session.started_at)
    .run();
  return mapSession(session);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db().prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

export async function getAllSessions(): Promise<Session[]> {
  const { results } = await db()
    .prepare(`SELECT ${SESSION_COLUMNS} FROM sessions ORDER BY started_at DESC LIMIT 200`)
    .all<SessionRow>();
  return results.map(mapSession);
}

export async function completeSession(sessionId: string): Promise<void> {
  await db()
    .prepare("UPDATE sessions SET completed_at = ? WHERE id = ?")
    .bind(now(), sessionId)
    .run();
}

export async function getExerciseLogsForSessions(
  sessionIds: string[],
): Promise<ExerciseLog[]> {
  const rows = await allInChunks<ExerciseLogRow>(
    sessionIds,
    (ids) => `SELECT ${EXERCISE_LOG_COLUMNS} FROM exercise_logs WHERE session_id IN (${ids})`,
  );
  return rows
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at))
    .map(mapExerciseLog);
}

export async function getSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
  return getExerciseLogsForSessions([sessionId]);
}

export async function getWarmupChecksForSessions(
  sessionIds: string[],
): Promise<WarmupCheck[]> {
  const rows = await allInChunks<WarmupCheckRow>(
    sessionIds,
    (ids) => `SELECT ${WARMUP_CHECK_COLUMNS} FROM warmup_checks WHERE session_id IN (${ids})`,
  );
  return rows.map(mapWarmupCheck);
}

export async function getWarmupChecks(sessionId: string): Promise<WarmupCheck[]> {
  return getWarmupChecksForSessions([sessionId]);
}

/** The most recent exercise logs, newest first. Used to prefill and show last time. */
export async function getRecentExerciseLogs(limit = 300): Promise<ExerciseLog[]> {
  const { results } = await db()
    .prepare(`SELECT ${EXERCISE_LOG_COLUMNS} FROM exercise_logs ORDER BY completed_at DESC LIMIT ?`)
    .bind(limit)
    .all<ExerciseLogRow>();
  return results.map(mapExerciseLog);
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
  await db()
    .prepare(
      `INSERT INTO exercise_logs (id, session_id, exercise_id, programme_exercise_id,
         exercise_name_snapshot, weight_kg, reps, sets, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (session_id, exercise_id) DO UPDATE SET
         programme_exercise_id = excluded.programme_exercise_id,
         exercise_name_snapshot = excluded.exercise_name_snapshot,
         weight_kg = excluded.weight_kg,
         reps = excluded.reps,
         sets = excluded.sets,
         completed_at = excluded.completed_at`,
    )
    .bind(
      crypto.randomUUID(),
      input.sessionId,
      input.exerciseId,
      input.programmeExerciseId,
      input.exerciseName,
      input.weightKg,
      input.reps,
      input.sets,
      now(),
    )
    .run();
}

export async function deleteExerciseLog(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  await db()
    .prepare("DELETE FROM exercise_logs WHERE session_id = ? AND exercise_id = ?")
    .bind(sessionId, exerciseId)
    .run();
}

export async function deleteWarmupCheck(
  sessionId: string,
  programmeExerciseId: string,
): Promise<void> {
  await db()
    .prepare("DELETE FROM warmup_checks WHERE session_id = ? AND programme_exercise_id = ?")
    .bind(sessionId, programmeExerciseId)
    .run();
}

export async function insertWarmupCheck(
  sessionId: string,
  programmeExerciseId: string,
  durationSeconds: number | null,
): Promise<void> {
  // Re-ticking keeps the first completed_at, as the Supabase upsert did
  await db()
    .prepare(
      `INSERT INTO warmup_checks (session_id, programme_exercise_id, duration_seconds, completed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (session_id, programme_exercise_id)
       DO UPDATE SET duration_seconds = excluded.duration_seconds`,
    )
    .bind(sessionId, programmeExerciseId, durationSeconds, now())
    .run();
}

export async function getPostSessionLogs(sessionIds: string[]): Promise<PostSessionLog[]> {
  const rows = await allInChunks<{ session_id: string; weight_kg: number | null; activities: string }>(
    sessionIds,
    (ids) =>
      `SELECT session_id, weight_kg, activities FROM post_session_logs WHERE session_id IN (${ids})`,
  );
  return rows.map((row) => ({
    sessionId: row.session_id,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    activities: JSON.parse(row.activities) as PostSessionLog["activities"],
  }));
}

/** Use session chronology, so correcting an old weigh-in cannot become the latest. */
export async function getPreviousBodyWeight(completedAt: string): Promise<number | null> {
  const row = await db()
    .prepare(
      `SELECT p.weight_kg FROM post_session_logs p
       JOIN sessions s ON s.id = p.session_id
       WHERE p.weight_kg IS NOT NULL AND s.completed_at < ?
       ORDER BY s.completed_at DESC LIMIT 1`,
    )
    .bind(completedAt)
    .first<{ weight_kg: number }>();
  return row ? Number(row.weight_kg) : null;
}

export async function savePostSessionLog(
  sessionId: string,
  values: PostSessionValues,
): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO post_session_logs (session_id, weight_kg, activities, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (session_id) DO UPDATE SET
         weight_kg = excluded.weight_kg,
         activities = excluded.activities,
         updated_at = excluded.updated_at`,
    )
    .bind(sessionId, values.weightKg, JSON.stringify(values.activities), now())
    .run();
}

/** Exact lifetime count and latest completion, independent of history pagination. */
export async function getProgrammeSessionSummary(programmeId: string): Promise<{
  totalSessions: number;
  lastCompletedAt: string | null;
}> {
  const row = await db()
    .prepare(
      `SELECT COUNT(*) AS total, MAX(completed_at) AS last FROM sessions
       WHERE programme_id = ? AND completed_at IS NOT NULL`,
    )
    .bind(programmeId)
    .first<{ total: number; last: string | null }>();
  return {
    totalSessions: row?.total ?? 0,
    lastCompletedAt: row?.last ?? null,
  };
}
