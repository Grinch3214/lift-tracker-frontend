<template>
  <van-action-sheet
    v-model:show="uiStore.exercisePicker.show"
    :closeable="false"
    class="exercise-picker"
    @closed="resetSelection"
  >
    <div class="exercise-picker__header">
      <div class="exercise-picker__title-row">
        <van-icon
          v-if="selectedGroup"
          name="arrow-left"
          size="18"
          class="exercise-picker__back-icon"
          @click="resetSelection"
        />
        <span class="exercise-picker__title">{{ headerTitle }}</span>
      </div>
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
          v-if="!selectedGroup"
          ref="groupListEl"
          class="exercise-picker__list"
        >
          <van-swipe-cell
            v-for="group in groupItems"
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
        </div>

        <div v-else ref="exerciseListEl" class="exercise-picker__list">
          <van-swipe-cell
            v-for="exercise in exerciseItems"
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
        </div>
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
import { useSortable } from '@vueuse/integrations/useSortable';
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

// Local working copies useSortable can freely reorder while dragging - same "id-set
// comparison to avoid ping-ponging with the persist watcher" pattern as index.vue's
// drag-and-drop for the day's exercise list, see CLAUDE.md for why.
const storedMuscleGroups = computed(() => getAllMuscleGroups());
const groupItems = ref<MuscleGroup[]>([]);
watch(
  storedMuscleGroups,
  (val) => {
    const currentIds = groupItems.value
      .map((g) => g.id)
      .sort()
      .join(',');
    const newIds = val
      .map((g) => g.id)
      .sort()
      .join(',');
    if (currentIds !== newIds) groupItems.value = [...val];
  },
  { immediate: true },
);

const groupListEl = ref<HTMLElement | null>(null);
useSortable(groupListEl, groupItems, {
  watchElement: true,
  delay: 150,
  delayOnTouchOnly: true,
  animation: 150,
});

watch(groupItems, (val) => {
  catalogStore.reorderMuscleGroups(val.map((g) => g.id));
});

const storedGroupExercises = computed(() =>
  selectedGroup.value ? getExercisesByMuscleGroup(selectedGroup.value.id) : [],
);
const exerciseItems = ref<Exercise[]>([]);
watch(
  storedGroupExercises,
  (val) => {
    const currentIds = exerciseItems.value
      .map((e) => e.id)
      .sort()
      .join(',');
    const newIds = val
      .map((e) => e.id)
      .sort()
      .join(',');
    if (currentIds !== newIds) exerciseItems.value = [...val];
  },
  { immediate: true },
);

const exerciseListEl = ref<HTMLElement | null>(null);
useSortable(exerciseListEl, exerciseItems, {
  watchElement: true,
  delay: 150,
  delayOnTouchOnly: true,
  animation: 150,
});

watch(exerciseItems, (val) => {
  if (!selectedGroup.value) return;
  catalogStore.reorderExercises(
    selectedGroup.value.id,
    val.map((e) => e.id),
  );
});

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
  position: relative;

  &__header {
    position: sticky;
    inset-block-start: 0;
    background: var(--van-cell-background);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-block-end: 1px solid var(--van-border-color);
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--van-text-color);
  }

  &__back-icon {
    cursor: pointer;
    color: var(--van-text-color-2);
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

  &__list {
    display: flex;
    flex-direction: column;

    :deep(.van-cell__title),
    :deep(.van-cell__value) {
      user-select: none;
    }
  }

  &__swipe-btn {
    height: 100%;
  }

  &__exercise-cell {
    &.is-selected {
      background: rgb(var(--van-primary-color-channels) / 12%);
    }

    :deep(.van-cell__title) {
      user-select: none;
    }
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
