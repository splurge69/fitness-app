export const EXERCISE_ART_KEYS = [
  "movement-prep",
  "assault-bike",
  "ball-lunges",
  "split-squat",
  "leg-extension",
  "leg-curl",
  "calf-raise",
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
};

const RULES: Array<{ key: ExerciseArtKey; match: RegExp }> = [
  { key: "split-squat", match: /bulgarian|split\s*squat/ },
  { key: "leg-extension", match: /extension/ },
  { key: "leg-curl", match: /curl|hamstring/ },
  { key: "calf-raise", match: /calf/ },
  { key: "assault-bike", match: /bike|cycle|spin/ },
  { key: "ball-lunges", match: /lunge|exercise\s*ball|\bball\b/ },
  { key: "movement-prep", match: /movement|cat.?cow|prepar|mobility|decelerat/ },
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
