import { type WorkoutExercise } from './workout-exercise';

// A single day's training session — one Workout per date
export interface Workout {
  id: string;
  date: string; // 'YYYY-MM-DD'
  exercises: WorkoutExercise[];
  createdAt: string; // ISO timestamp
  // TODO(cloud-sync, v1.3): add `updatedAt: string`, bumped on every mutation
  // (set/exercise add/edit/delete) — required by the backend's LWW push contract,
  // see docs/02-mvp.md (v1.3) and lift-tracker-backend's ARCHITECTURE.md section 5.
}
