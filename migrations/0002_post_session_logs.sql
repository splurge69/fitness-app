-- Optional extras belong to a session, never to a programme or exercise.
-- Activities are a JSON array so new kinds do not need another column or migration.
CREATE TABLE post_session_logs (
  session_id TEXT PRIMARY KEY REFERENCES sessions (id) ON DELETE CASCADE,
  weight_kg REAL CHECK (weight_kg > 0 AND weight_kg <= 1000),
  activities TEXT NOT NULL DEFAULT '[]' CHECK (json_type(activities) = 'array'),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
