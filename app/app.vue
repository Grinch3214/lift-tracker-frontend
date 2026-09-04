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
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { restoreSession } from '@/utils/authApi';

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

onMounted(() => {
  restoreSession();
});
</script>
