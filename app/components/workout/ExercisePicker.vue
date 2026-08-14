<template>
  <van-action-sheet
    v-model:show="uiStore.exercisePicker.show"
    :title="selectedGroup ? t(`catalog.muscleGroups.${selectedGroup.id}`) : t('exercisePicker.selectTitle')"
    class="exercise-picker"
    @closed="selectedGroup = null"
  >
    <div class="exercise-picker__content">
      <div v-if="selectedGroup" class="exercise-picker__back-btn" @click="selectedGroup = null">
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
          :title="t(`catalog.exercises.${exercise.id}`)"
          :label="exercise.equipment ? t(`units.equipment.${exercise.equipment}`) : ''"
          is-link
          @click="selectExercise(exercise)"
        />
      </van-list>
    </div>
  </van-action-sheet>
</template>

<script setup lang="ts">
import { showSuccessToast, showToast } from 'vant';
import type { MuscleGroup, Exercise } from '~~/types';
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { muscleGroups } from '@/data/muscle-groups';
import { getExercisesByMuscleGroup } from '@/utils/exercises';
import { formatDate } from '@/utils/date';
import { pluralize } from '@/utils/pluralize';

const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const { t } = useI18n();

const selectedGroup = ref<MuscleGroup | null>(null);

function exercisesCountLabel(muscleGroupId: string): string {
  const count = getExercisesByMuscleGroup(muscleGroupId).length;
  const word = pluralize(count, {
    one: t('units.exerciseWordOne'),
    few: t('units.exerciseWordFew'),
    many: t('units.exerciseWordMany'),
  });
  return t('units.countWord', { count, word });
}

function selectExercise(exercise: Exercise) {
  const date = formatDate(uiStore.selectedDate);
  const workout = workoutStore.getWorkoutByDate(date);
  const alreadyAdded = workout?.exercises.some(
    (e) => e.exerciseId === exercise.id,
  );
  const name = t(`catalog.exercises.${exercise.id}`);

  if (alreadyAdded) {
    showToast(t('exercisePicker.alreadyAdded', { name }));
    return;
  }

  workoutStore.addExercise(date, exercise.id);
  uiStore.exercisePicker.show = false;
  selectedGroup.value = null;
  showSuccessToast(t('exercisePicker.added', { name }));
}
</script>

<style scoped lang="scss">
.exercise-picker {
  height: 80%;

  &__back-btn {
    padding: 12px 16px;
    cursor: pointer;
    color: var(--van-primary-color);
    font-size: 14px;
    font-weight: 600;
  }
}
</style>
