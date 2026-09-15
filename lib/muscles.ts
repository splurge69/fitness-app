import { artKeyFor, type ExerciseArtKey } from "./exercise-art";

const MUSCLES: Partial<Record<ExerciseArtKey, string>> = {
  "split-squat": "Glutes",
  "leg-extension": "Quads",
  "leg-curl": "Hamstrings",
  "calf-raise": "Calves",
};

export function muscleFor(
  name: string,
  exerciseId?: string | null,
): string | null {
  return MUSCLES[artKeyFor(name, exerciseId)] ?? null;
}
