export const EXERCISE_ART_KEYS = [
  "movement-prep",
  "assault-bike",
  "ball-lunges",
  "split-squat",
  "leg-extension",
  "leg-curl",
  "calf-raise",
  "band-pull-apart",
  "bench-press",
  "lat-pulldown",
  "deadlift",
  "leg-press",
  "cable-row",
  "shoulder-press",
  "pallof-press",
  "treadmill",
  "cross-trainer",
  "carry",
  "dead-bug",
  "bird-dog",
  "push-up",
  "hip-thrust",
  "fallback",
] as const;

export type ExerciseArtKey = (typeof EXERCISE_ART_KEYS)[number];

const SEEDED_IDS: Record<string, ExerciseArtKey> = {
  "21111111-1111-4111-8111-111111111111": "movement-prep",
  "21111111-1111-4111-8111-111111111112": "assault-bike",
  "21111111-1111-4111-8111-111111111113": "ball-lunges",
  "21111111-1111-4111-8111-111111111114": "split-squat",
  "21111111-1111-4111-8111-111111111115": "leg-extension",
  "21111111-1111-4111-8111-111111111116": "leg-curl",
  "21111111-1111-4111-8111-111111111117": "calf-raise",
  "22222222-2222-4222-8222-222222222201": "band-pull-apart",
  "22222222-2222-4222-8222-222222222202": "bench-press",
  "22222222-2222-4222-8222-222222222203": "lat-pulldown",
  "22222222-2222-4222-8222-222222222204": "deadlift",
  "22222222-2222-4222-8222-222222222205": "leg-press",
  "22222222-2222-4222-8222-222222222206": "cable-row",
  "22222222-2222-4222-8222-222222222207": "shoulder-press",
  "22222222-2222-4222-8222-222222222208": "pallof-press",
  "23333333-3333-4333-8333-333333333301": "treadmill",
  "23333333-3333-4333-8333-333333333302": "cross-trainer",
  "23333333-3333-4333-8333-333333333303": "hip-thrust",
  "23333333-3333-4333-8333-333333333304": "push-up",
  "23333333-3333-4333-8333-333333333305": "carry",
  "23333333-3333-4333-8333-333333333306": "dead-bug",
  "23333333-3333-4333-8333-333333333307": "carry",
  "23333333-3333-4333-8333-333333333308": "bird-dog",
};

// Most specific first: "leg press" before "press", "leg curl" before "curl".
const RULES: Array<{ key: ExerciseArtKey; match: RegExp }> = [
  { key: "split-squat", match: /bulgarian|split\s*squat/ },
  { key: "leg-press", match: /leg\s*press/ },
  { key: "leg-extension", match: /extension/ },
  { key: "leg-curl", match: /leg\s*curl|hamstring\s*curl/ },
  { key: "calf-raise", match: /calf/ },
  { key: "pallof-press", match: /pallof|anti.?rotation/ },
  { key: "dead-bug", match: /dead\s*bug/ },
  { key: "bird-dog", match: /bird\s*dog/ },
  { key: "hip-thrust", match: /hip\s*thrust|glute\s*bridge/ },
  { key: "push-up", match: /push.?up|press.?up/ },
  { key: "carry", match: /carry|farmer|suitcase/ },
  { key: "cross-trainer", match: /cross.?trainer|elliptical/ },
  { key: "treadmill", match: /treadmill|\bwalk\b|\bjog\b|\brun\b/ },
  { key: "band-pull-apart", match: /pull.?apart|face\s*pull/ },
  { key: "lat-pulldown", match: /pull.?down|pull.?up|chin.?up|\blat\b/ },
  { key: "bench-press", match: /bench|chest\s*press|\bfly\b/ },
  { key: "shoulder-press", match: /shoulder|overhead|military|arnold/ },
  { key: "deadlift", match: /deadlift|\brdl\b|hinge|good\s*morning/ },
  { key: "cable-row", match: /\brow\b|\browing\b/ },
  { key: "assault-bike", match: /bike|cycle|spin/ },
  { key: "ball-lunges", match: /lunge|exercise\s*ball|\bball\b/ },
  { key: "movement-prep", match: /movement|cat.?cow|prepar|mobility|decelerat|stretch/ },
  { key: "split-squat", match: /\bsquat\b/ },
];

export function artKeyFor(
  name: string,
  exerciseId?: string | null,
): ExerciseArtKey {
  if (exerciseId && SEEDED_IDS[exerciseId]) {
    return SEEDED_IDS[exerciseId];
  }

  const haystack = name.trim().toLowerCase();
  if (!haystack) return "fallback";

  const rule = RULES.find((entry) => entry.match.test(haystack));
  return rule?.key ?? "fallback";
}
