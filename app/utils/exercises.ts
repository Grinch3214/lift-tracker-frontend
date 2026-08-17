import type { Exercise, MuscleGroup } from '~~/types';
import { muscleGroups, exercises } from '@/data/muscle-groups';
import { useCatalogStore } from '@/stores/catalog';

// Picker-facing: excludes soft-deleted custom entries, since those shouldn't be
// selectable for new workouts. getExerciseById/getMuscleGroupById below deliberately
// do NOT filter isDeleted - past workouts still need to resolve them by id.
export function getAllMuscleGroups(): MuscleGroup[] {
  const catalogStore = useCatalogStore();
  return [
    ...muscleGroups,
    ...catalogStore.customMuscleGroups.filter((group) => !group.isDeleted),
  ];
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
    (exercise) => exercise.muscleGroupId === muscleGroupId && !exercise.isDeleted,
  );
  const builtin = exercises.filter(
    (exercise) => exercise.muscleGroupId === muscleGroupId,
  );
  return [...custom, ...builtin];
}

// Catalog names are translated via t(`catalog.exercises.${id}`) / t(`catalog.muscleGroups.${id}`) -
// custom entries have no translation key (the user typed the name themselves), so they fall back
// to the raw `name` field instead, which for built-in entries is just an untranslated dev fallback.
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
