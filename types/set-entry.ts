export interface SetEntry {
  id: string;
  // weight-reps exercises populate weight/reps; time-distance exercises populate
  // durationSeconds/distanceKm instead - which pair depends on the parent Exercise.trackingType
  weight?: number; // kg, 0 for bodyweight exercises
  reps?: number;
  durationSeconds?: number;
  distanceKm?: number;
  isCompleted: boolean;
}
