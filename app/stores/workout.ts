import { computed } from 'vue';
import { defineStore } from 'pinia';
import type { Workout, WorkoutExercise, SetEntry } from '~~/types';
import { generateId } from '@/utils/id';
import { useIdbStorage } from '@/utils/idbStorage';

export interface ExerciseHistoryEntry {
  workoutId: string;
  date: string;
  sets: SetEntry[];
  maxWeight: number;
  totalVolume: number;
  bestSet: SetEntry | null;
}

export const useWorkoutStore = defineStore('workout', () => {
  // IndexedDB, not localStorage — this is the collection that grows without bound (years
  // of history). Loaded before the app mounts, see app/plugins/idb-load.client.ts.
  const { state: workouts, load } = useIdbStorage<Workout[]>(
    'lift-tracker-workouts',
    [],
  );

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
    if (index === -1) return;
    const [removed] = workout.exercises.splice(index, 1);

    // An emptied day deliberately keeps its Workout record (exercises: []) instead of
    // being deleted: deletion isn't synced, so a deleted day would stay on the server,
    // and the next exercise added that day would create a *second* Workout (new id, same
    // date) — rejected by the backend's UNIQUE (user_id, date). Keeping it means the day
    // keeps one stable id, and the push of the empty version clears the day on other
    // devices too. Empty workouts are filtered out of history and calendar dots.

    // A superset left with a single member isn't a superset anymore.
    const supersetId = removed?.supersetId;
    if (supersetId) {
      const remaining = workout.exercises.filter(
        (e) => e.supersetId === supersetId,
      );
      if (remaining.length === 1) delete remaining[0]!.supersetId;
    }

    touch(workout);
  }

  // Index range [start, end] of the contiguous run of exercises sharing the superset of
  // the exercise at `index` — just [index, index] when it isn't in a superset.
  function supersetRange(
    exercises: WorkoutExercise[],
    index: number,
  ): [number, number] {
    const supersetId = exercises[index]?.supersetId;
    if (!supersetId) return [index, index];
    let start = index;
    let end = index;
    while (exercises[start - 1]?.supersetId === supersetId) start--;
    while (exercises[end + 1]?.supersetId === supersetId) end++;
    return [start, end];
  }

  // Adds the exercise right below the whole superset (not just below this one) to it —
  // so linking from any member always appends the next exercise at the end of the group.
  // Creates the superset if this exercise isn't in one yet; if the next exercise is
  // already in another superset, the two merge into one.
  function linkWithNext(date: string, workoutExerciseId: string): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;
    const index = workout.exercises.findIndex(
      (e) => e.id === workoutExerciseId,
    );
    if (index === -1) return;

    const [start, end] = supersetRange(workout.exercises, index);
    const next = workout.exercises[end + 1];
    if (!next) return;
    const [, nextEnd] = supersetRange(workout.exercises, end + 1);

    const supersetId = workout.exercises[index]!.supersetId ?? generateId();
    for (let i = start; i <= nextEnd; i++) {
      workout.exercises[i]!.supersetId = supersetId;
    }
    touch(workout);
  }

  // Dissolves the whole superset, not just this one exercise — pulling a middle member
  // out would split the group in two.
  function unlinkSuperset(date: string, workoutExerciseId: string): void {
    const workout = getWorkoutByDate(date);
    if (!workout) return;
    const supersetId = workout.exercises.find(
      (e) => e.id === workoutExerciseId,
    )?.supersetId;
    if (!supersetId) return;

    workout.exercises.forEach((e) => {
      if (e.supersetId === supersetId) delete e.supersetId;
    });
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

  // Upsert from sync (push rejections and pulls), LWW by updatedAt. Matches by id first,
  // then by date: one Workout per date is an invariant on both ends (the backend has
  // UNIQUE (user_id, date)), but two devices — or an old deleted-then-recreated day —
  // can hold *different* ids for the same date. The backend resolves that by keeping the
  // newer one and dropping the other; this mirrors it locally, so a device never ends
  // up with two workouts on one day after a pull.
  function replaceWorkout(incoming: Workout): void {
    let index = workouts.value.findIndex((w) => w.id === incoming.id);
    if (index === -1) {
      index = workouts.value.findIndex((w) => w.date === incoming.date);
    }
    const existing = index === -1 ? undefined : workouts.value[index];
    if (!existing) {
      workouts.value.push(incoming);
      return;
    }
    if (incoming.updatedAt >= existing.updatedAt) {
      workouts.value.splice(index, 1, incoming);
    }
  }

  // Emptied days keep their Workout record (see removeExercise), so anything showing
  // "days that have a workout" must skip empty ones.
  const nonEmptyWorkouts = computed(() =>
    workouts.value.filter((w) => w.exercises.length > 0),
  );

  const workoutDates = computed(() => nonEmptyWorkouts.value.map((w) => w.date));

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
    load,
    getWorkoutByDate,
    getOrCreateWorkoutByDate,
    addExercise,
    removeExercise,
    linkWithNext,
    unlinkSuperset,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    replaceWorkout,
    nonEmptyWorkouts,
    workoutDates,
    getExerciseHistory,
    getPersonalRecord,
  };
});
