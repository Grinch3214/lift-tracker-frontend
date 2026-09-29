import { type SetEntry } from './set-entry';

// One exercise performed within a specific Workout (not the catalog entry itself)
export interface WorkoutExercise {
  id: string;
  exerciseId: string; // links to Exercise.id in the catalog
  sets: SetEntry[];
  order?: number; // display order within the workout
  // Shared label for 2+ exercises done as one superset — same UUID on every member, absent
  // otherwise. Not a reference to any record. Members are always contiguous in
  // Workout.exercises (workoutStore's superset actions maintain that).
  supersetId?: string;
}
