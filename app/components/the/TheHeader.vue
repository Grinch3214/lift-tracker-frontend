<template>
  <header class="header">
    <van-nav-bar
      :right-text="isWorkoutPage ? dateLabel : ''"
      @click-left="showSidebar = true"
      @click-right="isWorkoutPage && (showCalendar = true)"
    >
      <template #left>
        <van-icon name="wap-nav" size="18" />
      </template>
      <template #title>
        <span class="header__link" @click="goHome">{{ title }}</span>
      </template>
    </van-nav-bar>

    <van-calendar
      v-model:show="showCalendar"
      :show-confirm="false"
      :default-date="uiStore.selectedDate"
      :min-date="minDate"
      :max-date="maxDate"
      :formatter="dayFormatter"
      :color="settingsStore.primaryColorCss"
      @confirm="onConfirm"
    />

    <TheSidebar v-model:show="showSidebar" />
  </header>
</template>

<script setup lang="ts">
import type { CalendarDayItem } from 'vant';
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { useSettingsStore } from '@/stores/settings';
import { formatDate, isToday, formatShortDate } from '@/utils/date';

const route = useRoute();
const { t, locale } = useI18n();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const settingsStore = useSettingsStore();

const showCalendar = ref(false);
const showSidebar = ref(false);
const minDate = ref(new Date(2025, 0, 1));
const maxDate = ref(new Date(2030, 11, 31));

const isWorkoutPage = computed(() => route.path === '/');

const titles = computed<Record<string, string>>(() => ({
  '/': 'LiftTracker',
  '/history': t('nav.history'),
}));

const title = computed(() => titles.value[route.path] ?? 'LiftTracker');

const dateLabel = computed(() =>
  isToday(formatDate(uiStore.selectedDate))
    ? t('calendar.today')
    : formatShortDate(uiStore.selectedDate, locale.value),
);

function goHome() {
  uiStore.selectedDate = new Date();
  navigateTo('/');
}

function dayFormatter(day: CalendarDayItem): CalendarDayItem {
  if (day.date && workoutStore.workoutDates.includes(formatDate(day.date))) {
    day.bottomInfo = '·';
  }
  return day;
}

function onConfirm(date: Date) {
  uiStore.selectedDate = date;
  showCalendar.value = false;
}
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  inset-block-start: 0;
  z-index: 5;

  &__link {
    cursor: pointer;
  }
}
</style>
