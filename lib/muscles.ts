import { artKeyFor, type ExerciseArtKey } from "./exercise-art";

const MUSCLES: Partial<Record<ExerciseArtKey, string>> = {
  "split-squat": "Glutes",
  "leg-extension": "Quads",
  "leg-curl": "Hamstrings",
  "calf-raise": "Calves",
  "bench-press": "Chest",
  "lat-pulldown": "Lats",
  deadlift: "Hamstrings",
  "leg-press": "Quads",
  "cable-row": "Upper back",
  "shoulder-press": "Shoulders",
  "pallof-press": "Core",
};

export function muscleFor(
  name: string,
  exerciseId?: string | null,
): string | null {
  return MUSCLES[artKeyFor(name, exerciseId)] ?? null;
}
