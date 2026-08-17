import type { Exercise, MuscleGroup } from '~~/types';
import { muscleGroups, exercises } from '@/data/muscle-groups';
import { useCatalogStore } from '@/stores/catalog';

function applyOrder<T extends { id: string }>(
  items: T[],
  order: string[],
): T[] {
  if (!order.length) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined);
  const orderedIds = new Set(order);
  const rest = items.filter((item) => !orderedIds.has(item.id));
  return [...ordered, ...rest];
}

export function getAllMuscleGroups(): MuscleGroup[] {
  const catalogStore = useCatalogStore();
  const all = [
    ...muscleGroups,
    ...catalogStore.customMuscleGroups.filter((group) => !group.isDeleted),
  ];
  return applyOrder(all, catalogStore.groupOrder);
}

export function getExerciseById(id: string): Exercise | undefined {
  const catalogStore = useCatalogStore();
  return (
    exercises.find((exercise) => exercise.id === id) ??
    catalogStore.customExercises.find((exercise) => exercise.id === id)
  );
}

export function getMuscleGroupById(id: string): MuscleGroup | undefined {
  const catalogStore = useCatalogStore();
  return (
    muscleGroups.find((group) => group.id === id) ??
    catalogStore.customMuscleGroups.find((group) => group.id === id)
  );
}

export function getExercisesByMuscleGroup(muscleGroupId: string): Exercise[] {
  const catalogStore = useCatalogStore();
  const custom = catalogStore.customExercises.filter(
    (exercise) =>
      exercise.muscleGroupId === muscleGroupId && !exercise.isDeleted,
  );
  const builtin = exercises.filter(
    (exercise) => exercise.muscleGroupId === muscleGroupId,
  );
  const all = [...custom, ...builtin];
  return applyOrder(all, catalogStore.exerciseOrder[muscleGroupId] ?? []);
}

export function exerciseName(
  exercise: Exercise,
  t: (key: string) => string,
): string {
  return exercise.isCustom
    ? exercise.name
    : t(`catalog.exercises.${exercise.id}`);
}

export function muscleGroupName(
  group: MuscleGroup,
  t: (key: string) => string,
): string {
  return group.isCustom ? group.name : t(`catalog.muscleGroups.${group.id}`);
}
