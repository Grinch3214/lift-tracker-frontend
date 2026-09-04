import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type {
  MuscleGroup,
  Exercise,
  EquipmentType,
  TrackingType,
} from '~~/types';
import { generateId } from '@/utils/id';

export const useCatalogStore = defineStore('catalog', () => {
  const customMuscleGroups = useStorage<MuscleGroup[]>(
    'lift-tracker-custom-muscle-groups',
    [],
  );
  const customExercises = useStorage<Exercise[]>(
    'lift-tracker-custom-exercises',
    [],
  );
  const groupOrder = useStorage<string[]>('lift-tracker-group-order', []);
  const exerciseOrder = useStorage<Record<string, string[]>>(
    'lift-tracker-exercise-order',
    {},
  );
  // Companion timestamp for groupOrder+exerciseOrder together — the backend stores them as
  // one `catalog_order` row per user, so both reorder actions bump this single field.
  const catalogOrderUpdatedAt = useStorage<string>(
    'lift-tracker-catalog-order-updated-at',
    '',
  );

  function addMuscleGroup(name: string): MuscleGroup {
    const group: MuscleGroup = {
      id: generateId(),
      name,
      order: 0,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };
    customMuscleGroups.value.push(group);
    return group;
  }

  function addExercise(
    name: string,
    muscleGroupId: string,
    equipment: EquipmentType | undefined,
    trackingType: TrackingType,
  ): Exercise {
    const exercise: Exercise = {
      id: generateId(),
      muscleGroupId,
      name,
      isCustom: true,
      equipment,
      trackingType,
      updatedAt: new Date().toISOString(),
    };
    customExercises.value.unshift(exercise);
    return exercise;
  }

  function findMuscleGroup(id: string): MuscleGroup | undefined {
    return customMuscleGroups.value.find((g) => g.id === id);
  }

  function findExercise(id: string): Exercise | undefined {
    return customExercises.value.find((e) => e.id === id);
  }

  function updateMuscleGroup(id: string, name: string): void {
    const group = findMuscleGroup(id);
    if (!group) return;
    group.name = name;
    group.updatedAt = new Date().toISOString();
  }

  function deleteMuscleGroup(id: string): void {
    const group = findMuscleGroup(id);
    if (!group) return;
    group.isDeleted = true;
    group.updatedAt = new Date().toISOString();
  }

  function updateExercise(
    id: string,
    values: {
      name: string;
      equipment: EquipmentType | undefined;
      trackingType: TrackingType;
    },
  ): void {
    const exercise = findExercise(id);
    if (!exercise) return;
    Object.assign(exercise, values);
    exercise.updatedAt = new Date().toISOString();
  }

  function deleteExercise(id: string): void {
    const exercise = findExercise(id);
    if (!exercise) return;
    exercise.isDeleted = true;
    exercise.updatedAt = new Date().toISOString();
  }

  function reorderMuscleGroups(orderedIds: string[]): void {
    groupOrder.value = orderedIds;
    catalogOrderUpdatedAt.value = new Date().toISOString();
  }

  function reorderExercises(muscleGroupId: string, orderedIds: string[]): void {
    exerciseOrder.value = {
      ...exerciseOrder.value,
      [muscleGroupId]: orderedIds,
    };
    catalogOrderUpdatedAt.value = new Date().toISOString();
  }

  return {
    customMuscleGroups,
    customExercises,
    groupOrder,
    exerciseOrder,
    catalogOrderUpdatedAt,
    addMuscleGroup,
    addExercise,
    updateMuscleGroup,
    deleteMuscleGroup,
    updateExercise,
    deleteExercise,
    reorderMuscleGroups,
    reorderExercises,
  };
});
