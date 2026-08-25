import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { RestTimerMode } from '~~/types';

// Stored as bare "R G B" channels (no rgb() wrapper, no commas) so consumers can
// compose it with an alpha channel via rgb(var(--x) / 40%) where needed.
export const colorPresets = [
  '60 142 224', // blue (default)
  '7 193 96', // green
  '255 151 106', // orange
  '114 50 221', // purple
  '18 184 166', // teal
  '235 92 150', // pink
  '255 193 7', // amber
];

export const restTimerSounds = [
  { id: 'shaker-bell', labelKey: 'restTimer.sounds.shakerBell' },
  { id: 'cartoon-close-bell', labelKey: 'restTimer.sounds.cartoonCloseBell' },
  { id: 'achievement-bell', labelKey: 'restTimer.sounds.achievementBell' },
  { id: 'magical-bell', labelKey: 'restTimer.sounds.magicalBell' },
  { id: 'notification-bell', labelKey: 'restTimer.sounds.notificationBell' },
  { id: 'melodic-door-bell', labelKey: 'restTimer.sounds.melodicDoorBell' },
  { id: 'happy-bell', labelKey: 'restTimer.sounds.happyBell' },
  { id: 'service-bell', labelKey: 'restTimer.sounds.serviceBell' },
];

export const useSettingsStore = defineStore('settings', () => {
  const primaryColor = useStorage('lift-tracker-primary-color', colorPresets[0]!);
  const restTimerMode = useStorage<RestTimerMode>('lift-tracker-rest-timer-mode', 'off');
  const restTimerDuration = useStorage('lift-tracker-rest-timer-duration', 90);
  const restTimerSoundEnabled = useStorage(
    'lift-tracker-rest-timer-sound-enabled',
    true,
  );
  const restTimerSoundId = useStorage(
    'lift-tracker-rest-timer-sound-id',
    restTimerSounds[0]!.id,
  );

  const primaryColorCss = computed(() => `rgb(${primaryColor.value})`);

  return {
    primaryColor,
    primaryColorCss,
    restTimerMode,
    restTimerDuration,
    restTimerSoundEnabled,
    restTimerSoundId,
  };
});
