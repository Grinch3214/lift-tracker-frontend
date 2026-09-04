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

  // Upsert by id, LWW-guarded by updatedAt — same reasoning and same sync-only caller as
  // workoutStore.replaceWorkout(). Missing updatedAt (pre-dates the field) sorts as always
  // older, so a synced version always wins over a never-touched local one.
  function replaceMuscleGroup(incoming: MuscleGroup): void {
    const index = customMuscleGroups.value.findIndex((g) => g.id === incoming.id);
    const existing = index === -1 ? undefined : customMuscleGroups.value[index];
    if (!existing) {
      customMuscleGroups.value.push(incoming);
      return;
    }
    if ((incoming.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
      customMuscleGroups.value.splice(index, 1, incoming);
    }
  }

  function replaceExercise(incoming: Exercise): void {
    const index = customExercises.value.findIndex((e) => e.id === incoming.id);
    const existing = index === -1 ? undefined : customExercises.value[index];
    if (!existing) {
      customExercises.value.push(incoming);
      return;
    }
    if ((incoming.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
      customExercises.value.splice(index, 1, incoming);
    }
  }

  // Unconditional set, no LWW guard — unlike the two above, groupOrder/exerciseOrder are
  // called with the server's version only after it's already established as authoritative
  // (either a push rejection's `current`, or a pull result), so there's nothing left to
  // compare against locally by the time this runs.
  function setCatalogOrder(order: {
    groupOrder: string[];
    exerciseOrder: Record<string, string[]>;
    updatedAt: string;
  }): void {
    groupOrder.value = order.groupOrder;
    exerciseOrder.value = order.exerciseOrder;
    catalogOrderUpdatedAt.value = order.updatedAt;
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
    replaceMuscleGroup,
    replaceExercise,
    setCatalogOrder,
  };
});
