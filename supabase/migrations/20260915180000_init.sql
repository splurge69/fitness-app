create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  min_hours_between_sessions integer not null default 48,
  target_sessions_per_week integer not null default 2,
  min_sessions_per_week integer not null default 1,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cues text,
  laterality text not null default 'none' check (laterality in ('none', 'bilateral')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programme_exercises (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null,
  is_warmup boolean not null default false,
  target_sets integer,
  target_reps integer,
  target_weight_kg numeric,
  notes text,
  unique (programme_id, sort_order)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create table if not exists public.warmup_checks (
  session_id uuid not null references public.sessions(id) on delete cascade,
  programme_exercise_id uuid not null references public.programme_exercises(id),
  completed_at timestamptz not null default now(),
  primary key (session_id, programme_exercise_id)
);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  programme_exercise_id uuid references public.programme_exercises(id),
  exercise_name_snapshot text not null,
  side text not null default 'none' check (side in ('left', 'right', 'none')),
  set_number integer not null,
  reps integer not null,
  weight_kg numeric not null,
  completed_at timestamptz not null default now()
);

create index if not exists set_logs_session_idx on public.set_logs (session_id, completed_at);
create index if not exists set_logs_exercise_idx on public.set_logs (exercise_id, completed_at desc);
create index if not exists sessions_completed_idx on public.sessions (completed_at desc);

alter table public.programmes enable row level security;
alter table public.exercises enable row level security;
alter table public.programme_exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.warmup_checks enable row level security;
alter table public.set_logs enable row level security;

revoke all on public.programmes from anon, authenticated;
revoke all on public.exercises from anon, authenticated;
revoke all on public.programme_exercises from anon, authenticated;
revoke all on public.sessions from anon, authenticated;
revoke all on public.warmup_checks from anon, authenticated;
revoke all on public.set_logs from anon, authenticated;
