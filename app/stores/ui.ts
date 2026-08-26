import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { AddSetSheetState } from '~~/types';
import { useSettingsStore } from '@/stores/settings';

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
    defaultDumbbellCount: 2,
  });

  const exercisePicker = ref({ show: false });

  const restTimer = ref({
    active: false,
    remaining: 90,
    total: 90,
  });

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let restTimerAudio: HTMLAudioElement | null = null;

  function getRestTimerAudio(): HTMLAudioElement {
    if (!restTimerAudio) restTimerAudio = new Audio();
    return restTimerAudio;
  }

  function unlockRestTimerSound() {
    const settingsStore = useSettingsStore();
    const audio = getRestTimerAudio();
    audio.src = `/sounds/${settingsStore.restTimerSoundId}.mp3`;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  }

  function playSoundFile(soundId: string) {
    const audio = getRestTimerAudio();
    audio.src = `/sounds/${soundId}.mp3`;
    audio.currentTime = 0;
    audio.muted = false;
    audio.play().catch(() => {});
  }

  function playRestTimerSound() {
    const settingsStore = useSettingsStore();
    if (!settingsStore.restTimerSoundEnabled) return;
    playSoundFile(settingsStore.restTimerSoundId);
  }

  function previewRestTimerSound(soundId?: string) {
    const settingsStore = useSettingsStore();
    playSoundFile(soundId ?? settingsStore.restTimerSoundId);
  }

  function tickRestTimer() {
    if (restTimer.value.remaining > 0) {
      restTimer.value.remaining--;
    } else {
      restTimer.value.active = false;
      if (timerInterval) clearInterval(timerInterval);
      playRestTimerSound();
    }
  }

  function startRestTimer(seconds = 90) {
    if (timerInterval) clearInterval(timerInterval);
    restTimer.value = { active: true, remaining: seconds, total: seconds };
    timerInterval = setInterval(tickRestTimer, 1000);
  }

  function resumeRestTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (restTimer.value.remaining <= 0) return;
    restTimer.value.active = true;
    timerInterval = setInterval(tickRestTimer, 1000);
  }

  function resetRestTimer(seconds: number) {
    if (timerInterval) clearInterval(timerInterval);
    restTimer.value = { active: false, remaining: seconds, total: seconds };
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
    resumeRestTimer,
    resetRestTimer,
    stopRestTimer,
    unlockRestTimerSound,
    previewRestTimerSound,
  };
});
