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

-- Seed
-- ACL rehab programme. Safe to re-run: fixed ids, ignore conflicts.

insert into public.programmes (
  id,
  name,
  notes,
  min_hours_between_sessions,
  target_sessions_per_week,
  min_sessions_per_week,
  is_active
) values (
  '11111111-1111-4111-8111-111111111111',
  'ACL rehab',
  'Twice weekly, minimum once weekly. Leave at least 48 hours between sessions.',
  48,
  2,
  1,
  true
) on conflict (id) do nothing;

insert into public.exercises (id, name, cues, laterality) values
  (
    '21111111-1111-4111-8111-111111111111',
    'Movement preparation',
    'Cat-cow, decelerations, or similar to get moving before loading.',
    'none'
  ),
  (
    '21111111-1111-4111-8111-111111111112',
    'Assault bike',
    'Easy spin for 2 minutes.',
    'none'
  ),
  (
    '21111111-1111-4111-8111-111111111113',
    'Exercise ball + walking lunges with rotation',
    'Hold the ball and rotate to mobilise the back.',
    'none'
  ),
  (
    '21111111-1111-4111-8111-111111111114',
    'Bulgarian split squat',
    'Aim for 3 sets of 8. Increase weight rather than repetitions if it feels easy.',
    'bilateral'
  ),
  (
    '21111111-1111-4111-8111-111111111115',
    'Single-leg leg extension',
    'Both sides. Starting load used in clinic: 23 kg.',
    'bilateral'
  ),
  (
    '21111111-1111-4111-8111-111111111116',
    'Single-leg leg curl',
    'Light weight, 5–10 kg. Both sides.',
    'bilateral'
  ),
  (
    '21111111-1111-4111-8111-111111111117',
    'Calf raise',
    'On the floor, not a step. Hold the rack for balance only — load through the calf, do not pull on the rack.',
    'none'
  )
on conflict (id) do nothing;

insert into public.programme_exercises (
  id,
  programme_id,
  exercise_id,
  sort_order,
  is_warmup,
  target_sets,
  target_reps,
  target_weight_kg,
  notes
) values
  (
    '31111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111111',
    10,
    true,
    null,
    null,
    null,
    'Movement preparation before the bike.'
  ),
  (
    '31111111-1111-4111-8111-111111111112',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111112',
    20,
    true,
    null,
    1,
    null,
    '2 minutes.'
  ),
  (
    '31111111-1111-4111-8111-111111111113',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111113',
    30,
    true,
    null,
    null,
    null,
    'Mobilise the back before loaded work.'
  ),
  (
    '31111111-1111-4111-8111-111111111114',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111114',
    40,
    false,
    3,
    8,
    null,
    '2–3 sets, aiming for 3. Increase weight, not reps, if easy.'
  ),
  (
    '31111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111115',
    50,
    false,
    3,
    8,
    23,
    'Clinic starting load: 23 kg.'
  ),
  (
    '31111111-1111-4111-8111-111111111116',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111116',
    60,
    false,
    3,
    8,
    7.5,
    'Stay in the 5–10 kg range until it feels easy.'
  ),
  (
    '31111111-1111-4111-8111-111111111117',
    '11111111-1111-4111-8111-111111111111',
    '21111111-1111-4111-8111-111111111117',
    70,
    false,
    3,
    8,
    6,
    'Floor calf raise. 6 kg kettlebell can increase.'
  )
on conflict (id) do nothing;
