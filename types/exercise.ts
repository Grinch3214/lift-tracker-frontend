import { type EquipmentType } from './equipment-type';
import { type TrackingType } from './tracking-type';

export interface Exercise {
  id: string;
  muscleGroupId: string; // links to MuscleGroup.id
  name: string;
  isCustom: boolean;
  equipment?: EquipmentType;
  trackingType: TrackingType;
  order?: number;
  mediaUrl?: string;
  mediaId?: string;
  isDeleted?: boolean;
  updatedAt?: string;
}
