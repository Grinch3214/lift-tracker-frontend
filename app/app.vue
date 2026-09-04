<template>
  <NuxtRouteAnnouncer />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Locale } from 'vant';
import enUS from 'vant/es/locale/lang/en-US';
import ruRU from 'vant/es/locale/lang/ru-RU';
import { useOnline, useDocumentVisibility } from '@vueuse/core';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { runFullSync } from '@/utils/syncApi';

useHead({
  title: 'LiftTracker',
  meta: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content',
    },
  ],
});

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const authStore = useAuthStore();

watch(
  locale,
  (value) => {
    if (value === 'ru') {
      Locale.use('ru-RU', ruRU);
    } else {
      Locale.use('en-US', enUS);
    }
  },
  { immediate: true },
);

watch(
  () => settingsStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty(
      '--van-primary-color-channels',
      color,
    );
    document.documentElement.style.setProperty(
      '--van-primary-color',
      `rgb(${color})`,
    );
  },
  { immediate: true },
);

watch(
  () => settingsStore.restTimerMode,
  (mode) => {
    if (mode === 'off') {
      uiStore.stopRestTimer();
    } else if (mode === 'custom' && !uiStore.restTimer.active) {
      uiStore.resetRestTimer(settingsStore.restTimerDuration);
    }
  },
  { immediate: true },
);

watch(
  () => settingsStore.restTimerDuration,
  (duration) => {
    if (settingsStore.restTimerMode === 'custom' && !uiStore.restTimer.active) {
      uiStore.resetRestTimer(duration);
    }
  },
);

// Cloud-sync triggers (v1.3, item 5). Deliberately NOT wired to individual mutations
// (addSet etc. stay pure, no network awareness) — sync granularity is the whole Workout
// (backend decision, see lift-tracker-backend/ARCHITECTURE.md §7), so a per-mutation
// trigger would re-send the same growing workout on every single set. Time/visibility-
// based instead, decoupled from how many changes happened.
const isOnline = useOnline();
const visibility = useDocumentVisibility();

// Only a safety net for sessions that never background the tab (someone watching
// WorkoutRestTimer's countdown instead of switching apps between sets, or anyone on
// desktop) — visibility firing on `hidden` already covers the common mobile case of
// tucking the phone away between sets. 7 minutes is arbitrary but deliberately long:
// this exists to bound worst-case staleness, not to be the primary sync path.
const SYNC_BACKSTOP_INTERVAL_MS = 7 * 60 * 1000;
let syncBackstopInterval: ReturnType<typeof setInterval> | null = null;

function triggerSync() {
  if (!authStore.isAuthenticated || !isOnline.value) return;
  // Cheap to call speculatively even when nothing changed — pushLocalData() only hits the
  // network for records with updatedAt newer than lastSyncedAt, so an idle tick costs at
  // most one lightweight GET /sync/pull (checking for changes from another device).
  runFullSync().catch(() => {});
}

// Primary trigger — fires on leaving (tucked the phone away) and on returning (catch up
// on anything from another device). `immediate: true` also covers app boot while already
// logged in, which nothing else does eagerly.
watch(visibility, triggerSync, { immediate: true });

// Catches up on whatever queued locally while offline, the moment connectivity returns.
watch(isOnline, (online) => {
  if (online) triggerSync();
});

// Backstop timer — armed only while actually foregrounded, online, and authenticated; a
// hidden tab is already covered by the visibility watcher above (and mobile browsers
// throttle hidden-tab timers anyway, so polling there would be unreliable regardless).
watch(
  () =>
    authStore.isAuthenticated && isOnline.value && visibility.value === 'visible',
  (shouldRun) => {
    if (shouldRun && !syncBackstopInterval) {
      syncBackstopInterval = setInterval(triggerSync, SYNC_BACKSTOP_INTERVAL_MS);
    } else if (!shouldRun && syncBackstopInterval) {
      clearInterval(syncBackstopInterval);
      syncBackstopInterval = null;
    }
  },
  { immediate: true },
);
</script>
