export type Laterality = "none" | "bilateral";

export type Programme = {
  id: string;
  name: string;
  notes: string | null;
};

export type ProgrammeExercise = {
  id: string;
  programmeId: string;
  exerciseId: string;
  name: string;
  cues: string | null;
  laterality: Laterality;
  tracksDuration: boolean;
  isWarmup: boolean;
  sortOrder: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  notes: string | null;
};

export type Session = {
  id: string;
  programmeId: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
};

/** One line per exercise per session: the weight, reps and number of sets. */
export type ExerciseLog = {
  id: string;
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string | null;
  exerciseNameSnapshot: string;
  weightKg: number;
  reps: number;
  sets: number;
  completedAt: string;
};

export type WarmupCheck = {
  sessionId: string;
  programmeExerciseId: string;
  durationSeconds: number | null;
  completedAt: string;
};
