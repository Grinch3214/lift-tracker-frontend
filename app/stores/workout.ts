import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { Workout, WorkoutExercise, SetEntry } from '~~/types';
import { generateId } from '@/utils/id';

export interface ExerciseHistoryEntry {
  workoutId: string;
  date: string;
  sets: SetEntry[];
  maxWeight: number;
  totalVolume: number;
  bestSet: SetEntry | null;
}

export const useWorkoutStore = defineStore('workout', () => {
  const workouts = useStorage<Workout[]>('lift-tracker-workouts', []);

  function getWorkoutByDate(date: string): Workout | undefined {
    return workouts.value.find((workout) => workout.date === date);
  }

  function getOrCreateWorkoutByDate(date: string): Workout {
    let workout = getWorkoutByDate(date);
    if (!workout) {
      const now = new Date().toISOString();
      workout = {
        id: generateId(),
        date,
        exercises: [],
        createdAt: now,
        updatedAt: now,
      };
      workouts.value.push(workout);
    }
    return workout;
  }

  function touch(workout: Workout): void {
    workout.updatedAt = new Date().toISOString();
  }

  function addExercise(date: string, exerciseId: string): WorkoutExercise {
    const workout = getOrCreateWorkoutByDate(date);

    const workoutExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId,
      sets: [],
      order: workout.exercises.length,
    };
    workout.exercises.push(workoutExercise);
    touch(workout);
    return workoutExercise;
  }

  function removeExercise(date: string, workoutExerciseId: string): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;

    const index = workout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId,
    );
    if (index !== -1) workout.exercises.splice(index, 1);

    if (workout.exercises.length === 0) {
      const workoutIndex = workouts.value.findIndex((w) => w.id === workout.id);
      if (workoutIndex !== -1) workouts.value.splice(workoutIndex, 1);
      return;
    }

    touch(workout);
  }

  function reorderExercises(date: string, orderedIds: string[]): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;

    const byId = new Map(
      workout.exercises.map((exercise) => [exercise.id, exercise]),
    );
    workout.exercises = orderedIds
      .map((id) => byId.get(id))
      .filter(
        (exercise): exercise is WorkoutExercise => exercise !== undefined,
      );
    workout.exercises.forEach((exercise, index) => {
      exercise.order = index;
    });
    touch(workout);
  }

  type SetValues = Pick<
    SetEntry,
    'weight' | 'reps' | 'durationSeconds' | 'distanceKm' | 'dumbbellCount'
  >;

  function addSet(
    date: string,
    workoutExerciseId: string,
    values: SetValues,
  ): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;
    const exercise = workout.exercises.find((e) => e.id === workoutExerciseId);
    if (!exercise) return;

    exercise.sets.push({
      id: generateId(),
      ...values,
      isCompleted: true,
    });
    touch(workout);
  }

  function updateSet(
    date: string,
    workoutExerciseId: string,
    setId: string,
    values: SetValues,
  ): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;
    const exercise = workout.exercises.find((e) => e.id === workoutExerciseId);
    const set = exercise?.sets.find((s) => s.id === setId);
    if (!set) return;

    Object.assign(set, values);
    touch(workout);
  }

  function removeSet(
    date: string,
    workoutExerciseId: string,
    setId: string,
  ): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;
    const exercise = workout.exercises.find((e) => e.id === workoutExerciseId);
    if (!exercise) return;

    const index = exercise.sets.findIndex((s) => s.id === setId);
    if (index !== -1) {
      exercise.sets.splice(index, 1);
      touch(workout);
    }
  }

  const workoutDates = computed(() => workouts.value.map((w) => w.date));

  function getExerciseHistory(exerciseId: string): ExerciseHistoryEntry[] {
    return workouts.value
      .filter((workout) =>
        workout.exercises.some((e) => e.exerciseId === exerciseId),
      )
      .map((workout) => {
        const sets = workout.exercises
          .filter((e) => e.exerciseId === exerciseId)
          .flatMap((e) => e.sets);
        const maxWeight =
          sets.length > 0 ? Math.max(...sets.map((s) => s.weight ?? 0)) : 0;
        const totalVolume = sets.reduce(
          (sum, s) =>
            sum + (s.weight ?? 0) * (s.dumbbellCount ?? 1) * (s.reps ?? 0),
          0,
        );
        const bestSet =
          sets.length > 0
            ? sets.reduce((best, s) =>
                (s.weight ?? 0) > (best.weight ?? 0) ? s : best,
              )
            : null;
        return {
          workoutId: workout.id,
          date: workout.date,
          sets,
          maxWeight,
          totalVolume,
          bestSet,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function getPersonalRecord(
    exerciseId: string,
  ): { weight: number; reps: number; date: string } | null {
    const history = getExerciseHistory(exerciseId);
    if (!history.length) return null;

    let pr = { weight: 0, reps: 0, date: '' };
    history.forEach((entry) => {
      entry.sets.forEach((set) => {
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        if (weight > pr.weight || (weight === pr.weight && reps > pr.reps)) {
          pr = { weight, reps, date: entry.date };
        }
      });
    });
    return pr.reps > 0 ? pr : null;
  }

  return {
    workouts,
    getWorkoutByDate,
    getOrCreateWorkoutByDate,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    workoutDates,
    getExerciseHistory,
    getPersonalRecord,
  };
});
