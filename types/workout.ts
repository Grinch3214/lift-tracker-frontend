import { type WorkoutExercise } from './workout-exercise';

// A single day's training session — one Workout per date
export interface Workout {
  id: string;
  date: string; // 'YYYY-MM-DD'
  exercises: WorkoutExercise[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp, bumped on every mutation — see workoutStore's `touch()`
}
