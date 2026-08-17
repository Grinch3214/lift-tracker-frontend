import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { MuscleGroup, Exercise, EquipmentType, TrackingType } from '~~/types';
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

  function addMuscleGroup(name: string): MuscleGroup {
    const group: MuscleGroup = {
      id: generateId(),
      name,
      order: 0,
      isCustom: true,
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
    };
    // Unshift, not push - a freshly-added exercise should show at the top of
    // its muscle group's list instead of being buried at the bottom.
    customExercises.value.unshift(exercise);
    return exercise;
  }

  function updateMuscleGroup(id: string, name: string): void {
    const group = customMuscleGroups.value.find((g) => g.id === id);
    if (!group) return;
    group.name = name;
  }

  function deleteMuscleGroup(id: string): void {
    const group = customMuscleGroups.value.find((g) => g.id === id);
    if (!group) return;
    group.isDeleted = true;
  }

  function updateExercise(
    id: string,
    values: {
      name: string;
      equipment: EquipmentType | undefined;
      trackingType: TrackingType;
    },
  ): void {
    const exercise = customExercises.value.find((e) => e.id === id);
    if (!exercise) return;
    Object.assign(exercise, values);
  }

  function deleteExercise(id: string): void {
    const exercise = customExercises.value.find((e) => e.id === id);
    if (!exercise) return;
    exercise.isDeleted = true;
  }

  return {
    customMuscleGroups,
    customExercises,
    addMuscleGroup,
    addExercise,
    updateMuscleGroup,
    deleteMuscleGroup,
    updateExercise,
    deleteExercise,
  };
});
