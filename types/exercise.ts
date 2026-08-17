import { type EquipmentType } from './equipment-type';
import { type TrackingType } from './tracking-type';

export interface Exercise {
  id: string;
  muscleGroupId: string; // links to MuscleGroup.id
  name: string;
  isCustom: boolean; // true if added by the user, false for the built-in catalog
  equipment?: EquipmentType;
  trackingType: TrackingType;
  order?: number; // display order within the muscle group
  // Soft-delete: hidden from the picker but still resolvable by id, so past workouts
  // that logged this exercise keep displaying correctly. Custom exercises only.
  isDeleted?: boolean;
}
