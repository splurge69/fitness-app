-- Replace General fitness with two sub-hour programmes for fat loss, toning and
-- long-term health, to rotate with ACL rehab. Low impact and knee-friendly.
-- Safe to re-run. General fitness is archived, not deleted, so its sessions
-- stay in History.

alter table public.programmes
  add column if not exists archived_at timestamptz;

update public.programmes
set archived_at = now()
where id = '12222222-2222-4222-8222-222222222222' and archived_at is null;

insert into public.exercises (id, name, cues, laterality, tracks_duration) values
  (
    '23333333-3333-4333-8333-333333333301',
    'Incline treadmill walk',
    'Brisk walk at 8–12% incline, around 5–6 km/h. You should be able to talk in short sentences. Hands off the rails.',
    'none',
    true
  ),
  (
    '23333333-3333-4333-8333-333333333302',
    'Cross-trainer',
    'Smooth, steady pace. Push and pull the handles. Breathing harder but in control.',
    'none',
    true
  ),
  (
    '23333333-3333-4333-8333-333333333303',
    'Hip thrust',
    'Upper back on a bench, feet flat. Drive through the heels, squeeze the glutes at the top, ribs down.',
    'none',
    false
  ),
  (
    '23333333-3333-4333-8333-333333333304',
    'Incline push-up',
    'Hands on a bench or Smith bar, body in one straight line. Lower the chest to the bar. Log 0 kg.',
    'none',
    false
  ),
  (
    '23333333-3333-4333-8333-333333333305',
    'Farmer carry',
    'A heavy dumbbell or kettlebell in each hand. Stand tall, short quick steps. Reps = lengths of the gym floor.',
    'none',
    false
  ),
  (
    '23333333-3333-4333-8333-333333333306',
    'Dead bug',
    'Lower back pressed into the floor. Slowly lower the opposite arm and leg, then swap. A rep is both sides. Log 0 kg.',
    'bilateral',
    false
  ),
  (
    '23333333-3333-4333-8333-333333333307',
    'Suitcase carry',
    'One weight in one hand. Walk tall without leaning, then swap hands. Reps = lengths; a set is both hands.',
    'bilateral',
    false
  ),
  (
    '23333333-3333-4333-8333-333333333308',
    'Bird dog',
    'On hands and knees, pad under the knees. Reach the opposite arm and leg long, pause two seconds, return. Hips level. Log 0 kg.',
    'bilateral',
    false
  )
on conflict (id) do nothing;

insert into public.programmes (id, name, notes, is_active) values
  (
    '13333333-3333-4333-8333-333333333333',
    'Full body tone',
    'Strength circuit for fat loss and long-term health. Moderate weight, 12–15 reps, 60 seconds rest. Do each pair back to back to keep your heart rate up. About 50 minutes.',
    false
  ),
  (
    '14444444-4444-4444-8444-444444444444',
    'Cardio & core',
    'Heart and lungs first, then hinge and core work. Low impact throughout. About 45–50 minutes.',
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
  -- Full body tone
  ('33333333-3333-4333-8333-333333333301', '13333333-3333-4333-8333-333333333333', '21111111-1111-4111-8111-111111111112', 10, true, null, null, null, '5 minutes, easy to moderate.'),
  ('33333333-3333-4333-8333-333333333302', '13333333-3333-4333-8333-333333333333', '21111111-1111-4111-8111-111111111111', 20, true, null, null, null, '2 minutes.'),
  ('33333333-3333-4333-8333-333333333303', '13333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222201', 30, true, null, null, null, '2 × 15, light band.'),
  ('33333333-3333-4333-8333-333333333304', '13333333-3333-4333-8333-333333333333', '23333333-3333-4333-8333-333333333303', 40, false, 3, 12, null, 'Pair with lat pulldown.'),
  ('33333333-3333-4333-8333-333333333305', '13333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222203', 50, false, 3, 12, null, 'Light enough for 12 clean reps.'),
  ('33333333-3333-4333-8333-333333333306', '13333333-3333-4333-8333-333333333333', '23333333-3333-4333-8333-333333333304', 60, false, 3, 10, 0, 'Pair with seated cable row.'),
  ('33333333-3333-4333-8333-333333333307', '13333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222206', 70, false, 3, 12, null, 'Squeeze the shoulder blades.'),
  ('33333333-3333-4333-8333-333333333308', '13333333-3333-4333-8333-333333333333', '23333333-3333-4333-8333-333333333305', 80, false, 3, 2, null, 'Two lengths per set.'),
  ('33333333-3333-4333-8333-333333333309', '13333333-3333-4333-8333-333333333333', '23333333-3333-4333-8333-333333333306', 90, false, 3, 8, 0, 'Slow and controlled.'),
  ('33333333-3333-4333-8333-333333333310', '13333333-3333-4333-8333-333333333333', '23333333-3333-4333-8333-333333333301', 100, false, null, null, null, '12–15 minutes steady to finish.'),
  -- Cardio & core
  ('34444444-4444-4444-8444-444444444401', '14444444-4444-4444-8444-444444444444', '23333333-3333-4333-8333-333333333301', 10, true, null, null, null, '5 minutes, easy pace.'),
  ('34444444-4444-4444-8444-444444444402', '14444444-4444-4444-8444-444444444444', '21111111-1111-4111-8111-111111111111', 20, true, null, null, null, '2 minutes.'),
  ('34444444-4444-4444-8444-444444444403', '14444444-4444-4444-8444-444444444444', '21111111-1111-4111-8111-111111111112', 30, false, null, null, null, '10 rounds: 20 seconds hard, 40 seconds easy. Log the total time.'),
  ('34444444-4444-4444-8444-444444444404', '14444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222204', 40, false, 3, 12, null, 'Light and controlled. Pair with Pallof press.'),
  ('34444444-4444-4444-8444-444444444405', '14444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222208', 50, false, 3, 10, null, '10 each side.'),
  ('34444444-4444-4444-8444-444444444406', '14444444-4444-4444-8444-444444444444', '23333333-3333-4333-8333-333333333307', 60, false, 3, 2, null, 'One length each hand per set.'),
  ('34444444-4444-4444-8444-444444444407', '14444444-4444-4444-8444-444444444444', '23333333-3333-4333-8333-333333333308', 70, false, 3, 8, 0, '8 each side.'),
  ('34444444-4444-4444-8444-444444444408', '14444444-4444-4444-8444-444444444444', '23333333-3333-4333-8333-333333333302', 80, false, null, null, null, '15–20 minutes steady to finish.')
on conflict (id) do nothing;
