export type Laterality = "none" | "bilateral";
export type Side = "left" | "right" | "none";

export type Programme = {
  id: string;
  name: string;
  notes: string | null;
  minHoursBetweenSessions: number;
  targetSessionsPerWeek: number;
  minSessionsPerWeek: number;
  isActive: boolean;
};

export type ProgrammeExercise = {
  id: string;
  programmeId: string;
  exerciseId: string;
  name: string;
  cues: string | null;
  laterality: Laterality;
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

export type SetLog = {
  id: string;
  sessionId: string;
  exerciseId: string;
  programmeExerciseId: string | null;
  exerciseNameSnapshot: string;
  side: Side;
  setNumber: number;
  reps: number;
  weightKg: number;
  completedAt: string;
};

export type WarmupCheck = {
  sessionId: string;
  programmeExerciseId: string;
  completedAt: string;
};
