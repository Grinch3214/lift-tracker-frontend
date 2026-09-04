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

  const authModal = ref<{
    show: boolean;
    initialMode: 'register' | 'login';
  }>({
    show: false,
    initialMode: 'register',
  });

  const restTimer = ref({
    active: false,
    remaining: 90,
    total: 90,
  });

  // Transient "you have N free workouts left" toast — see AddSetSheet.vue#confirm(),
  // the only place that shows it, at fixed remaining-count milestones.
  const guestNudge = ref<{ show: boolean; remaining: number }>({
    show: false,
    remaining: 0,
  });

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let restTimerAudio: HTMLAudioElement | null = null;
  let guestNudgeTimeout: ReturnType<typeof setTimeout> | null = null;

  function showGuestNudge(remaining: number) {
    if (guestNudgeTimeout) clearTimeout(guestNudgeTimeout);
    guestNudge.value = { show: true, remaining };
    guestNudgeTimeout = setTimeout(() => {
      guestNudge.value.show = false;
    }, 4500);
  }

  function hideGuestNudge() {
    if (guestNudgeTimeout) clearTimeout(guestNudgeTimeout);
    guestNudge.value.show = false;
  }

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
    authModal,
    restTimer,
    guestNudge,
    showGuestNudge,
    hideGuestNudge,
    startRestTimer,
    resumeRestTimer,
    resetRestTimer,
    stopRestTimer,
    unlockRestTimerSound,
    previewRestTimerSound,
  };
});
