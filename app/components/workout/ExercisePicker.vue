<template>
  <van-action-sheet
    v-model:show="uiStore.exercisePicker.show"
    :title="
      selectedGroup
        ? t(`catalog.muscleGroups.${selectedGroup.id}`)
        : t('exercisePicker.selectTitle')
    "
    class="exercise-picker"
    @closed="resetSelection"
  >
    <div class="exercise-picker__content">
      <div
        class="exercise-picker__scroll"
        :class="{ 'has-footer': selectedIds.size > 0 }"
      >
        <div
          v-if="selectedGroup"
          class="exercise-picker__back-btn"
          @click="resetSelection"
        >
          {{ t('exercisePicker.back') }}
        </div>

        <van-list v-if="!selectedGroup">
          <van-cell
            v-for="group in muscleGroups"
            :key="group.id"
            :title="t(`catalog.muscleGroups.${group.id}`)"
            :value="exercisesCountLabel(group.id)"
            is-link
            @click="selectedGroup = group"
          />
        </van-list>

        <van-list v-else>
          <van-cell
            v-for="exercise in getExercisesByMuscleGroup(selectedGroup.id)"
            :key="exercise.id"
            class="exercise-picker__exercise-cell"
            :class="{ 'is-selected': selectedIds.has(exercise.id) }"
            :title="t(`catalog.exercises.${exercise.id}`)"
            :label="
              exercise.equipment
                ? t(`units.equipment.${exercise.equipment}`)
                : ''
            "
            clickable
            @click="toggleExercise(exercise)"
          />
        </van-list>
      </div>

      <div v-if="selectedIds.size > 0" class="exercise-picker__footer">
        <van-button type="primary" @click="confirmSelection">
          {{ t('exercisePicker.addSelected') }} <span class="dot">·</span>
          {{ selectedIds.size }}
        </van-button>
      </div>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { showSuccessToast } from 'vant';
import type { MuscleGroup, Exercise } from '~~/types';
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { muscleGroups } from '@/data/muscle-groups';
import { getExercisesByMuscleGroup } from '@/utils/exercises';
import { formatDate } from '@/utils/date';
import { pluralize } from '@/utils/pluralize';

const { t } = useI18n();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();

const selectedGroup = ref<MuscleGroup | null>(null);
const selectedIds = ref<Set<string>>(new Set());

function exercisesCountLabel(muscleGroupId: string): string {
  const count = getExercisesByMuscleGroup(muscleGroupId).length;
  const word = pluralize(count, {
    one: t('units.exerciseWordOne'),
    few: t('units.exerciseWordFew'),
    many: t('units.exerciseWordMany'),
  });
  return t('units.countWord', { count, word });
}

function toggleExercise(exercise: Exercise) {
  if (selectedIds.value.has(exercise.id)) {
    selectedIds.value.delete(exercise.id);
  } else {
    selectedIds.value.add(exercise.id);
  }
}

function resetSelection() {
  selectedGroup.value = null;
  selectedIds.value.clear();
}

function confirmSelection() {
  const date = formatDate(uiStore.selectedDate);
  const count = selectedIds.value.size;
  selectedIds.value.forEach((id) => workoutStore.addExercise(date, id));

  uiStore.exercisePicker.show = false;
  resetSelection();
  showSuccessToast(`${t('exercisePicker.added')} · ${count}`);
}
</script>

<style scoped lang="scss">
.exercise-picker {
  height: 80%;
  display: flex;
  flex-direction: column;

  &__content {
    flex: 1;
    position: relative;
    min-height: 0;
  }

  &__scroll {
    height: 100%;
    overflow-y: auto;

    &.has-footer {
      padding-block-end: calc(20px + env(safe-area-inset-bottom));
    }
  }

  &__back-btn {
    padding: 12px 16px;
    cursor: pointer;
    color: var(--van-primary-color);
    font-size: 14px;
    font-weight: 600;
  }

  &__exercise-cell.is-selected {
    background: rgb(var(--van-primary-color-channels) / 12%);
  }

  &__footer {
    position: sticky;
    inset-inline: 0;
    inset-block-end: 0;
    z-index: 10;
    padding: 12px 16px;
    padding-block-end: calc(12px + env(safe-area-inset-bottom));
    background: var(--van-background-2);
    box-shadow: 0 -2px 12px rgb(0 0 0 / 12%);
    text-align: end;
  }
}
</style>
