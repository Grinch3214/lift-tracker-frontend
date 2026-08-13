<template>
  <header class="header">
    <van-nav-bar
      :left-text="locale.toUpperCase()"
      :right-text="isWorkoutPage ? dateLabel : ''"
      @click-left="toggleLocale"
      @click-right="isWorkoutPage && (showCalendar = true)"
    >
      <template #title>
        <span class="title-link" @click="goHome">{{ title }}</span>
      </template>
    </van-nav-bar>

    <van-calendar
      v-model:show="showCalendar"
      :show-confirm="false"
      :default-date="uiStore.selectedDate"
      :min-date="minDate"
      :max-date="maxDate"
      :formatter="dayFormatter"
      color="#3c8ee0"
      @confirm="onConfirm"
    />
  </header>
</template>

<script setup lang="ts">
import type { CalendarDayItem } from 'vant';
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { formatDate, isToday, formatShortDate } from '@/utils/date';

const route = useRoute();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const { t, locale, setLocale } = useI18n();

const showCalendar = ref(false);
const minDate = ref(new Date(2025, 0, 1));
const maxDate = ref(new Date(2030, 11, 31));

const isWorkoutPage = computed(() => route.path === '/');

const titles = computed<Record<string, string>>(() => ({
  '/': 'LiftTracker',
  '/history': t('nav.history'),
}));

const title = computed(() => titles.value[route.path] ?? 'LiftTracker');

const dateLabel = computed(() =>
  isToday(formatDate(uiStore.selectedDate)) ? t('calendar.today') : formatShortDate(uiStore.selectedDate, locale.value),
);

function toggleLocale() {
  setLocale(locale.value === 'en' ? 'ru' : 'en');
}

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
}

.title-link {
  cursor: pointer;
}
</style>
