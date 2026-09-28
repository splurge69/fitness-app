-- Optional extras belong to a session, never to a programme or exercise.
-- Activities are a list so new kinds do not need another column or migration.
create table if not exists public.post_session_logs (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  weight_kg numeric check (weight_kg > 0 and weight_kg <= 1000),
  activities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(activities) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.post_session_logs enable row level security;
revoke all on public.post_session_logs from anon, authenticated;
