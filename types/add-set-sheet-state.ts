export interface AddSetSheetState {
  show: boolean;
  date: string;
  workoutExerciseId: string;
  exerciseId: string;
  setId: string | null;
  defaultWeight: number;
  defaultReps: number;
  defaultDurationSeconds: number;
  defaultDistanceKm: number;
}
