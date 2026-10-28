-- The Supabase schema as of the 2026-09-26 migration, in SQLite.
-- ids are text UUIDs, booleans 0/1, timestamps ISO 8601 UTC text
-- (e.g. 2026-10-28T09:15:00.000Z) so they sort as text.

CREATE TABLE programmes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  min_hours_between_sessions INTEGER NOT NULL DEFAULT 48,
  target_sessions_per_week INTEGER NOT NULL DEFAULT 2,
  min_sessions_per_week INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cues TEXT,
  laterality TEXT NOT NULL DEFAULT 'none' CHECK (laterality IN ('none', 'bilateral')),
  tracks_duration INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE programme_exercises (
  id TEXT PRIMARY KEY,
  programme_id TEXT NOT NULL REFERENCES programmes (id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises (id),
  sort_order INTEGER NOT NULL,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight_kg REAL,
  notes TEXT,
  UNIQUE (programme_id, sort_order)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  programme_id TEXT NOT NULL REFERENCES programmes (id),
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT,
  notes TEXT
);
CREATE INDEX sessions_completed_idx ON sessions (completed_at DESC);

CREATE TABLE warmup_checks (
  session_id TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  programme_exercise_id TEXT NOT NULL REFERENCES programme_exercises (id),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (session_id, programme_exercise_id)
);

CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises (id),
  programme_exercise_id TEXT REFERENCES programme_exercises (id) ON DELETE SET NULL,
  exercise_name_snapshot TEXT NOT NULL,
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  sets INTEGER NOT NULL CHECK (sets > 0),
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (session_id, exercise_id)
);
CREATE INDEX exercise_logs_exercise_idx ON exercise_logs (exercise_id, completed_at DESC);

-- Per-set history from before 2026-09-25, kept as a backup; the app no longer reads it
CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises (id),
  programme_exercise_id TEXT REFERENCES programme_exercises (id),
  exercise_name_snapshot TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'none' CHECK (side IN ('left', 'right', 'none')),
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
