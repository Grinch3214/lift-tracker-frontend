import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { RestTimerMode } from '~~/types';

// value stored as bare "R G B" channels (no rgb() wrapper, no commas) so consumers
// can compose it with an alpha channel via rgb(var(--x) / 40%) where needed.
export const colorPresets = [
  { value: '60 142 224', labelKey: 'sidebar.colors.blue' },
  { value: '7 193 96', labelKey: 'sidebar.colors.green' },
  { value: '255 151 106', labelKey: 'sidebar.colors.orange' },
  { value: '114 50 221', labelKey: 'sidebar.colors.purple' },
  { value: '18 184 166', labelKey: 'sidebar.colors.teal' },
  { value: '235 92 150', labelKey: 'sidebar.colors.pink' },
  { value: '255 193 7', labelKey: 'sidebar.colors.amber' },
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
  const primaryColor = useStorage(
    'lift-tracker-primary-color',
    colorPresets[0]!.value,
  );
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
