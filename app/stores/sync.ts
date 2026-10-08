import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useSyncStore = defineStore('sync', () => {
  const lastSyncedAt = useStorage<string>('lift-tracker-last-synced-at', '');

  const syncing = ref(false);
  const lastSyncError = ref<string | null>(null);

  return {
    lastSyncedAt,
    syncing,
    lastSyncError,
  };
});
