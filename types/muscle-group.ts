export interface MuscleGroup {
  id: string;
  /** Display name (Chest, Back...) */
  name: string;
  order: number; // display order in lists
  isCustom: boolean; // true if added by the user, false for the built-in catalog
  // Soft-delete: hidden from the picker but still resolvable by id, so past workouts
  // that used an exercise from this group keep displaying correctly. Custom groups only.
  isDeleted?: boolean;
  // ISO timestamp, bumped on every mutation. Custom groups only — required for cloud-sync
  // LWW (see lift-tracker-backend's WireCustomMuscleGroup); built-in entries never set this.
  updatedAt?: string;
}
