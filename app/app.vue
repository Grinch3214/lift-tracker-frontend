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
</script>
