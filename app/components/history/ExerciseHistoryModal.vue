<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    closeable
    class="history-modal"
  >
    <div class="history-modal__handle" />

    <div class="history-modal__header">
      <span class="history-modal__title">{{ t('exerciseHistory.title') }}</span>
      <span class="history-modal__exercise-name">{{ exerciseName }}</span>
    </div>

    <div v-if="history.length === 0" class="history-modal__empty">
      {{ t('exerciseHistory.empty') }}
    </div>

    <div v-else class="history-modal__list">
      <div
        v-for="entry in history"
        :key="entry.workoutId"
        class="history-modal__entry"
      >
        <div class="history-modal__entry-date">{{ formatDateLabel(entry.date, locale) }}</div>
        <div class="history-modal__entry-sets">
          <span v-for="set in entry.sets" :key="set.id" class="history-modal__entry-set">
            {{ weightLabel(set.weight) }} × {{ set.reps }}
          </span>
        </div>
        <div class="history-modal__entry-stats">
          <span>{{ t('exerciseHistory.best', { value: entry.bestSet ? `${weightLabel(entry.bestSet.weight)} × ${entry.bestSet.reps}` : t('exerciseHistory.noBest') }) }}</span>
          <span class="dot">·</span>
          <span>{{ t('exerciseHistory.kgTotal', { volume: entry.totalVolume.toLocaleString() }) }}</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { getExerciseById } from '@/utils/exercises';
import { isBodyweight } from '@/utils/format';
import { formatDateLabel } from '@/utils/date';

const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const { t, locale } = useI18n();

const show = computed({
  get: () => uiStore.historyExerciseId !== null,
  set: (val: boolean) => {
    if (!val) uiStore.closeExerciseHistory();
  },
});

const exerciseName = computed(() =>
  uiStore.historyExerciseId && getExerciseById(uiStore.historyExerciseId)
    ? t(`catalog.exercises.${uiStore.historyExerciseId}`)
    : '',
);

const history = computed(() => {
  if (!uiStore.historyExerciseId) return [];
  return [
    ...workoutStore.getExerciseHistory(uiStore.historyExerciseId),
  ].reverse();
});

function weightLabel(weight: number): string {
  return isBodyweight(weight) ? t('units.bodyweight') : `${weight} ${t('units.kg')}`;
}
</script>

<style scoped lang="scss">
.history-modal {
  padding: 0 16px 40px;
  max-height: 70%;

  &__handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--van-gray-5);
    margin: 12px auto 0;
  }

  &__header {
    padding: 16px 0 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__title {
    font-size: 13px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__exercise-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__empty {
    text-align: center;
    padding: 24px 0;
    color: var(--van-text-color-2);
    font-size: 14px;
  }

  &__list {
    overflow-y: auto;
    max-height: 50vh;
  }

  &__entry {
    padding: 10px 0;
    border-block-start: 1px solid var(--van-border-color);
  }

  &__entry-date {
    font-size: 13px;
    font-weight: 700;
    color: var(--van-text-color);
    margin-block-end: 4px;
  }

  &__entry-sets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-block-end: 4px;
  }

  &__entry-set {
    font-size: 12px;
    color: var(--van-text-color);
    background: var(--van-background);
    border-radius: 6px;
    padding: 2px 6px;
  }

  &__entry-stats {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--van-text-color-2);
  }
}
</style>
