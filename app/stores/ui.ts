import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { AddSetSheetState } from '~~/types';

export const useUiStore = defineStore('ui', () => {
  const selectedDate = ref<Date>(new Date());

  const addSetSheet = ref<AddSetSheetState>({
    show: false,
    date: '',
    workoutExerciseId: '',
    exerciseId: '',
    setId: null,
    defaultWeight: 0,
    defaultReps: 0,
    defaultDurationSeconds: 0,
    defaultDistanceKm: 0,
  });

  const exercisePicker = ref({ show: false });

  const restTimer = ref({
    active: false,
    remaining: 90,
    total: 90,
  });

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  function startRestTimer(seconds = 90) {
    if (timerInterval) clearInterval(timerInterval);
    restTimer.value = { active: true, remaining: seconds, total: seconds };
    timerInterval = setInterval(() => {
      if (restTimer.value.remaining > 0) {
        restTimer.value.remaining--;
      } else {
        restTimer.value.active = false;
        if (timerInterval) clearInterval(timerInterval);
      }
    }, 1000);
  }

  function stopRestTimer() {
    if (timerInterval) clearInterval(timerInterval);
    restTimer.value.active = false;
  }

  return {
    selectedDate,
    addSetSheet,
    exercisePicker,
    restTimer,
    startRestTimer,
    stopRestTimer,
  };
});
