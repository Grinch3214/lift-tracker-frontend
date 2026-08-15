<template>
  <div class="workout-item" @click="open">
    <div class="workout-item__date">
      <span class="workout-item__day">{{ dayLabel }}</span>
      <span class="workout-item__weekday">{{ weekdayLabel }}</span>
    </div>
    <div class="workout-item__stats">
      <span class="workout-item__group-names">{{ groupNames }}</span>
      <span class="dot">·</span>
      <span>{{ setsCountLabel }}</span>
      <span class="dot">·</span>
      <span>{{
        t('history.kg', { weight: totalVolume.toLocaleString() })
      }}</span>
    </div>
    <van-icon name="arrow" size="14" color="#888" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Workout } from '~~/types';
import { useUiStore } from '@/stores/ui';
import { parseDate, formatWeekdayLabel } from '@/utils/date';
import { getExerciseById } from '@/utils/exercises';
import { pluralize } from '@/utils/pluralize';

const props = defineProps<{ workout: Workout }>();
const uiStore = useUiStore();
const { t, locale } = useI18n();

const date = computed(() => parseDate(props.workout.date));

const dayLabel = computed(() => date.value.getDate());
const weekdayLabel = computed(() =>
  formatWeekdayLabel(date.value, locale.value),
);

const groupNames = computed(() => {
  const groupIds = new Set(
    props.workout.exercises
      .map((we) => getExerciseById(we.exerciseId)?.muscleGroupId)
      .filter((id): id is string => Boolean(id)),
  );
  return [...groupIds].map((id) => t(`catalog.muscleGroups.${id}`)).join(', ');
});

const totalSets = computed(() =>
  props.workout.exercises.reduce((sum, e) => sum + e.sets.length, 0),
);

const setsCountLabel = computed(() => {
  const word = pluralize(totalSets.value, {
    one: t('units.setWordOne'),
    few: t('units.setWordFew'),
    many: t('units.setWordMany'),
  });
  return t('units.countWord', { count: totalSets.value, word });
});

const totalVolume = computed(() =>
  props.workout.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  ),
);

function open() {
  uiStore.selectedDate = date.value;
  navigateTo('/');
}
</script>

<style scoped lang="scss">
.workout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-block-end: 1px solid var(--van-border-color);
  cursor: pointer;

  &__date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 44px;
  }

  &__day {
    font-size: 18px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__weekday {
    font-size: 11px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
  }

  &__stats {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: 13px;
    color: var(--van-text-color-2);
    min-width: 0;
  }

  &__group-names {
    color: var(--van-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    min-width: 0;
  }
}
</style>
