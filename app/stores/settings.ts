import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

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

export const useSettingsStore = defineStore('settings', () => {
  const primaryColor = useStorage('lift-tracker-primary-color', colorPresets[0]!);

  const primaryColorCss = computed(() => `rgb(${primaryColor.value})`);

  return {
    primaryColor,
    primaryColorCss,
  };
});
