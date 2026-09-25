-- Multiple programmes, one log line per exercise, and timed warm-ups.
-- Additive and safe to re-run. The old set_logs table is left in place as a
-- backup; drop it once you are happy with the migrated history.

alter table public.exercises
  add column if not exists tracks_duration boolean not null default false;

alter table public.warmup_checks
  add column if not exists duration_seconds integer
    check (duration_seconds is null or duration_seconds >= 0);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  programme_exercise_id uuid references public.programme_exercises(id) on delete set null,
  exercise_name_snapshot text not null,
  weight_kg numeric not null check (weight_kg >= 0),
  reps integer not null check (reps > 0),
  sets integer not null check (sets > 0),
  completed_at timestamptz not null default now(),
  unique (session_id, exercise_id)
);

create index if not exists exercise_logs_exercise_idx
  on public.exercise_logs (exercise_id, completed_at desc);

alter table public.exercise_logs enable row level security;
revoke all on public.exercise_logs from anon, authenticated;

-- Collapse per-set logs into one line per exercise per session:
-- the heaviest weight, the best reps at that weight, and the number of sets.
-- On a bilateral lift one left + one right counts as one set.
insert into public.exercise_logs (
  session_id,
  exercise_id,
  programme_exercise_id,
  exercise_name_snapshot,
  weight_kg,
  reps,
  sets,
  completed_at
)
select
  s.session_id,
  s.exercise_id,
  (array_agg(s.programme_exercise_id order by s.completed_at desc))[1],
  (array_agg(s.exercise_name_snapshot order by s.completed_at desc))[1],
  max(s.weight_kg),
  (array_agg(s.reps order by s.weight_kg desc, s.reps desc))[1],
  greatest(
    count(*) filter (where s.side = 'left'),
    count(*) filter (where s.side = 'right'),
    count(*) filter (where s.side = 'none')
  ),
  max(s.completed_at)
from public.set_logs s
group by s.session_id, s.exercise_id
on conflict (session_id, exercise_id) do nothing;

-- The bike warm-up logs how long you rode.
update public.exercises
set tracks_duration = true
where id = '21111111-1111-4111-8111-111111111112';

-- General fitness programme. Knee-friendly full-body strength: no jumping,
-- running or deep loaded knee flexion.
insert into public.programmes (
  id,
  name,
  notes,
  min_hours_between_sessions,
  target_sessions_per_week,
  min_sessions_per_week,
  is_active
) values (
  '12222222-2222-4222-8222-222222222222',
  'General fitness',
  'Full-body strength, twice a week. Knee-friendly: no jumping or running. Add weight once every set hits the top of the rep target.',
  24,
  2,
  1,
  false
) on conflict (id) do nothing;

insert into public.exercises (id, name, cues, laterality, tracks_duration) values
  (
    '22222222-2222-4222-8222-222222222201',
    'Band pull-aparts',
    'Arms straight, squeeze the shoulder blades together. 2 × 15 to wake up the upper back.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Dumbbell bench press',
    'Feet planted, shoulder blades pinned. Lower to the chest under control.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'Lat pulldown',
    'Pull the bar to the top of the chest. Lead with the elbows, no swinging.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'Romanian deadlift',
    'Dumbbells or barbell. Soft knees, push the hips back, flat back. Stop when the hamstrings are tight.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'Leg press',
    'Feet shoulder-width, mid-platform. Stop above 90° at the knee. Push through the whole foot.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'Seated cable row',
    'Chest up, pull to the belly button, pause, then return slowly.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    'Dumbbell shoulder press',
    'Seated, back supported. Press straight up without arching.',
    'none',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222208',
    'Pallof press',
    'Cable at chest height, stand side-on. Press out and resist the twist. One set is both sides.',
    'bilateral',
    false
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
    '32222222-2222-4222-8222-222222222201',
    '12222222-2222-4222-8222-222222222222',
    '21111111-1111-4111-8111-111111111112',
    10,
    true,
    null,
    null,
    null,
    '5 minutes, building to a steady effort.'
  ),
  (
    '32222222-2222-4222-8222-222222222202',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222201',
    20,
    true,
    null,
    null,
    null,
    'Light band.'
  ),
  (
    '32222222-2222-4222-8222-222222222203',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222202',
    30,
    false,
    3,
    8,
    null,
    '3 × 8. Leave one or two reps in the tank.'
  ),
  (
    '32222222-2222-4222-8222-222222222204',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222203',
    40,
    false,
    3,
    10,
    null,
    '3 × 10.'
  ),
  (
    '32222222-2222-4222-8222-222222222205',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222204',
    50,
    false,
    3,
    8,
    null,
    '3 × 8. Start light and own the hinge.'
  ),
  (
    '32222222-2222-4222-8222-222222222206',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222205',
    60,
    false,
    3,
    10,
    null,
    '3 × 10. Check with your physio before loading it heavily.'
  ),
  (
    '32222222-2222-4222-8222-222222222207',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222206',
    70,
    false,
    3,
    10,
    null,
    '3 × 10.'
  ),
  (
    '32222222-2222-4222-8222-222222222208',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222207',
    80,
    false,
    3,
    8,
    null,
    '3 × 8.'
  ),
  (
    '32222222-2222-4222-8222-222222222209',
    '12222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222208',
    90,
    false,
    3,
    10,
    null,
    '3 × 10 each side.'
  )
on conflict (id) do nothing;
