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
}
