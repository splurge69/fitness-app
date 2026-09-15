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
