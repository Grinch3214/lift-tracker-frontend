<template>
  <van-action-sheet
    v-model:show="uiStore.exercisePicker.show"
    :closeable="false"
    class="exercise-picker"
    @closed="resetSelection"
  >
    <div class="exercise-picker__header">
      <span class="exercise-picker__title">{{ headerTitle }}</span>
      <div class="exercise-picker__header-actions">
        <van-icon name="plus" size="18" @click="openAddModal" />
        <van-icon
          name="cross"
          size="18"
          @click="uiStore.exercisePicker.show = false"
        />
      </div>
    </div>

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
          <van-swipe-cell
            v-for="group in allMuscleGroups"
            :key="group.id"
            :disabled="!group.isCustom"
          >
            <van-cell
              :title="muscleGroupName(group, t)"
              :value="exercisesCountLabel(group.id)"
              is-link
              @click="selectedGroup = group"
            />
            <template #right>
              <van-button
                square
                type="primary"
                class="exercise-picker__swipe-btn"
                :text="t('exercisePicker.edit')"
                @click="editGroup(group)"
              />
              <van-button
                square
                type="danger"
                class="exercise-picker__swipe-btn"
                :text="t('workout.remove')"
                @click="confirmDeleteGroup(group)"
              />
            </template>
          </van-swipe-cell>
        </van-list>

        <van-list v-else>
          <van-swipe-cell
            v-for="exercise in currentGroupExercises"
            :key="exercise.id"
            :disabled="!exercise.isCustom"
          >
            <van-cell
              class="exercise-picker__exercise-cell"
              :class="{ 'is-selected': selectedIds.has(exercise.id) }"
              :title="exerciseName(exercise, t)"
              :label="
                exercise.equipment
                  ? t(`units.equipment.${exercise.equipment}`)
                  : ''
              "
              clickable
              @click="toggleExercise(exercise)"
            />
            <template #right>
              <van-button
                square
                type="primary"
                class="exercise-picker__swipe-btn"
                :text="t('exercisePicker.edit')"
                @click="editExercise(exercise)"
              />
              <van-button
                square
                type="danger"
                class="exercise-picker__swipe-btn"
                :text="t('workout.remove')"
                @click="confirmDeleteExercise(exercise)"
              />
            </template>
          </van-swipe-cell>
        </van-list>
      </div>

      <div v-if="selectedIds.size > 0" class="exercise-picker__footer">
        <van-button type="primary" @click="confirmSelection">
          {{ t('exercisePicker.addSelected') }} <span class="dot">·</span>
          {{ selectedIds.size }}
        </van-button>
      </div>
    </div>

    <WorkoutAddMuscleGroupModal
      v-model:show="showAddGroupModal"
      :editing-group="editingGroup"
    />
    <WorkoutAddExerciseModal
      v-model:show="showAddExerciseModal"
      :muscle-group="selectedGroup"
      :editing-exercise="editingExercise"
    />
  </van-action-sheet>
</template>

<script setup lang="ts">
import { showConfirmDialog, showSuccessToast } from 'vant';
import type { MuscleGroup, Exercise } from '~~/types';
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { useCatalogStore } from '@/stores/catalog';
import {
  getAllMuscleGroups,
  getExercisesByMuscleGroup,
  exerciseName,
  muscleGroupName,
} from '@/utils/exercises';
import { formatDate } from '@/utils/date';
import { pluralize } from '@/utils/pluralize';

const { t } = useI18n();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const catalogStore = useCatalogStore();

const selectedGroup = ref<MuscleGroup | null>(null);
const selectedIds = ref<Set<string>>(new Set());
const showAddGroupModal = ref(false);
const showAddExerciseModal = ref(false);
const editingGroup = ref<MuscleGroup | null>(null);
const editingExercise = ref<Exercise | null>(null);

const allMuscleGroups = computed(() => getAllMuscleGroups());

const currentGroupExercises = computed(() =>
  selectedGroup.value
    ? getExercisesByMuscleGroup(selectedGroup.value.id)
    : [],
);

const headerTitle = computed(() =>
  selectedGroup.value
    ? muscleGroupName(selectedGroup.value, t)
    : t('exercisePicker.selectTitle'),
);

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

function openAddModal() {
  if (selectedGroup.value) {
    editingExercise.value = null;
    showAddExerciseModal.value = true;
  } else {
    editingGroup.value = null;
    showAddGroupModal.value = true;
  }
}

function editGroup(group: MuscleGroup) {
  editingGroup.value = group;
  showAddGroupModal.value = true;
}

function editExercise(exercise: Exercise) {
  editingExercise.value = exercise;
  showAddExerciseModal.value = true;
}

async function confirmDeleteGroup(group: MuscleGroup) {
  try {
    await showConfirmDialog({
      title: t('exercisePicker.deleteGroupTitle'),
      confirmButtonText: t('workout.remove'),
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  catalogStore.deleteMuscleGroup(group.id);
}

async function confirmDeleteExercise(exercise: Exercise) {
  try {
    await showConfirmDialog({
      title: t('exercisePicker.deleteExerciseTitle'),
      confirmButtonText: t('workout.remove'),
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  catalogStore.deleteExercise(exercise.id);
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

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-block-end: 1px solid var(--van-border-color);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--van-text-color);
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--van-text-color-2);
    cursor: pointer;
  }

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

  &__swipe-btn {
    height: 100%;
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
