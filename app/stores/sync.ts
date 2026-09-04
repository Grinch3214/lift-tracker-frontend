import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useSyncStore = defineStore('sync', () => {
  // ISO timestamp — the `serverTime` from the last successful pull. Sent as `?since=` on
  // the next pull (so it only returns what's new) and, informationally, as `lastSyncedAt`
  // in the push body (the backend contract accepts it but doesn't act on it — LWW is
  // decided per-record by each record's own updatedAt, see API.md). Empty string = never
  // synced yet, meaning the next pull asks for full history.
  const lastSyncedAt = useStorage<string>('lift-tracker-last-synced-at', '');

  // Transient UI state — not persisted, resets on reload. No consumer yet (no sync status
  // indicator built), but syncApi.ts already needs somewhere to record these.
  const syncing = ref(false);
  const lastSyncError = ref<string | null>(null);

  return {
    lastSyncedAt,
    syncing,
    lastSyncError,
  };
});
