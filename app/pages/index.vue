<template>
  <div ref="pageEl" class="workout-page">
    <WorkoutRestTimer />

    <Transition :name="transitionName" mode="out-in">
      <div :key="currentDate" class="workout-page__content">
        <WorkoutEmptyState v-if="storedExercises.length === 0" />

        <template v-else>
          <div ref="listEl" class="workout-page__list">
            <div
              v-for="(block, blockIndex) in blocks"
              :key="block.id"
              class="workout-page__block"
              :class="{ 'is-superset': block.items.length > 1 }"
            >
              <div
                v-if="block.items.length > 1"
                class="workout-page__superset-label"
              >
                {{ t('workout.superset') }}
              </div>
              <WorkoutExerciseCard
                v-for="we in block.items"
                :key="we.id"
                :exercise="getExercise(we.exerciseId)"
                :workout-exercise="we"
                :can-link-next="blockIndex < blocks.length - 1"
                @add-set="openAddSet(we)"
                @edit-set="(set: SetEntry) => openEditSet(we, set)"
                @delete-set="(setId: string) => removeSet(we.id, setId)"
                @delete-exercise="removeExercise(we.id)"
                @link-next="
                  workoutStore.linkWithNext(currentDate, we.id)
                "
                @unlink-superset="
                  workoutStore.unlinkSuperset(currentDate, we.id)
                "
              />
            </div>
          </div>

          <div class="workout-page__summary">{{ summaryText }}</div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { showConfirmDialog } from 'vant';
import { useSwipe } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';
import type { Exercise, SetEntry, WorkoutExercise } from '~~/types';
import { useWorkoutStore } from '@/stores/workout';
import { useUiStore } from '@/stores/ui';
import { getExerciseById } from '@/utils/exercises';
import { formatDate, addDays } from '@/utils/date';
import { pluralize } from '@/utils/pluralize';

const { t } = useI18n();
const workoutStore = useWorkoutStore();
const uiStore = useUiStore();

const pageEl = ref<HTMLElement | null>(null);
const swipeDirection = ref<'left' | 'right'>('left');
const transitionName = computed(() => `slide-${swipeDirection.value}`);

useSwipe(pageEl, {
  threshold: 50,
  onSwipeEnd(_event, direction) {
    if (direction === 'left') {
      swipeDirection.value = 'left';
      uiStore.selectedDate = addDays(uiStore.selectedDate, 1);
    } else if (direction === 'right') {
      swipeDirection.value = 'right';
      uiStore.selectedDate = addDays(uiStore.selectedDate, -1);
    }
  },
});

const currentDate = computed(() => formatDate(uiStore.selectedDate));

// Spreading (not just returning the property) forces iteration, which is what makes
// Vue's reactivity actually track push/splice mutations on the nested array - a plain
// property read only tracks whether `.exercises` itself gets reassigned.
const storedExercises = computed(() => [
  ...(workoutStore.getWorkoutByDate(currentDate.value)?.exercises ?? []),
]);

// Drag-and-drop works on blocks, not individual cards: a block is either a single
// exercise or a whole superset (consecutive exercises sharing a supersetId), so a
// superset always moves as one unit and can never be split apart by a drag.
interface ExerciseBlock {
  id: string; // supersetId for a superset, the exercise's own id otherwise
  items: WorkoutExercise[];
}

function toBlocks(list: WorkoutExercise[]): ExerciseBlock[] {
  const result: ExerciseBlock[] = [];
  for (const we of list) {
    const last = result[result.length - 1];
    if (we.supersetId && last?.id === we.supersetId) {
      last.items.push(we);
    } else {
      result.push({ id: we.supersetId ?? we.id, items: [we] });
    }
  }
  return result;
}

// Id + superset membership, order-independent — changes on add/remove/link/unlink/date
// switch, but not on a reorder.
function structureKey(list: WorkoutExercise[]): string {
  return list
    .map((e) => `${e.id}:${e.supersetId ?? ''}`)
    .sort()
    .join(',');
}

// Local working copy useSortable can freely reorder while dragging. Only rebuilt from
// the store when the structure actually changes - not on every store write, since
// reorderExercises() below would otherwise echo straight back into this watcher and
// ping-pong forever. The key is computed inside the watch getter on purpose: that's what
// makes Vue track each element's `supersetId` — watching storedExercises itself only
// tracks the array, so a link/unlink (which mutates elements in place) went unnoticed.
const blocks = ref<ExerciseBlock[]>([]);
watch(
  () => structureKey(storedExercises.value),
  () => {
    blocks.value = toBlocks(storedExercises.value);
  },
  { immediate: true },
);

const listEl = ref<HTMLElement | null>(null);
useSortable(listEl, blocks, {
  watchElement: true, // .workout-page__list is destroyed/recreated on every date swipe (:key="currentDate")
  delay: 150,
  delayOnTouchOnly: true,
  animation: 150,
  chosenClass: 'is-dragging',
});

watch(blocks, (val) => {
  workoutStore.reorderExercises(
    currentDate.value,
    val.flatMap((b) => b.items.map((e) => e.id)),
  );
});

const totalSets = computed(() =>
  storedExercises.value.reduce((sum, ex) => sum + ex.sets.length, 0),
);

const totalVolume = computed(() =>
  storedExercises.value.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce(
        (s, set) =>
          s + (set.weight ?? 0) * (set.dumbbellCount ?? 1) * (set.reps ?? 0),
        0,
      ),
    0,
  ),
);

const exerciseWord = computed(() =>
  pluralize(storedExercises.value.length, {
    one: t('units.exerciseWordOne'),
    few: t('units.exerciseWordFew'),
    many: t('units.exerciseWordMany'),
  }),
);

const setWord = computed(() =>
  pluralize(totalSets.value, {
    one: t('units.setWordOne'),
    few: t('units.setWordFew'),
    many: t('units.setWordMany'),
  }),
);

const summaryText = computed(() =>
  t('workout.summary', {
    exercises: t('units.countWord', {
      count: storedExercises.value.length,
      word: exerciseWord.value,
    }),
    sets: t('units.countWord', { count: totalSets.value, word: setWord.value }),
    volume: totalVolume.value.toLocaleString(),
  }),
);

// Falls back to a minimal stand-in instead of crashing the whole page when exerciseId
// doesn't resolve to any known catalog entry (built-in or custom) — can legitimately
// happen with data that reached this device via sync (another device's custom exercise
// not yet pulled here, or any other data-integrity edge case). isCustom: true makes
// exerciseName() render the id itself rather than trying (and failing) a catalog
// translation lookup for it.
function getExercise(exerciseId: string): Exercise {
  return (
    getExerciseById(exerciseId) ?? {
      id: exerciseId,
      muscleGroupId: '',
      name: exerciseId,
      isCustom: true,
      trackingType: 'weight-reps',
    }
  );
}

function openAddSet(we: WorkoutExercise) {
  const lastSet = we.sets.length > 0 ? we.sets[we.sets.length - 1] : null;
  uiStore.addSetSheet = {
    show: true,
    date: currentDate.value,
    workoutExerciseId: we.id,
    exerciseId: we.exerciseId,
    setId: null,
    defaultWeight: lastSet?.weight ?? 0,
    defaultReps: lastSet?.reps ?? 0,
    defaultDurationSeconds: lastSet?.durationSeconds ?? 0,
    defaultDistanceKm: lastSet?.distanceKm ?? 0,
    defaultDumbbellCount: lastSet?.dumbbellCount ?? 2,
  };
}

function openEditSet(we: WorkoutExercise, set: SetEntry) {
  uiStore.addSetSheet = {
    show: true,
    date: currentDate.value,
    workoutExerciseId: we.id,
    exerciseId: we.exerciseId,
    setId: set.id,
    defaultWeight: set.weight ?? 0,
    defaultReps: set.reps ?? 0,
    defaultDurationSeconds: set.durationSeconds ?? 0,
    defaultDistanceKm: set.distanceKm ?? 0,
    defaultDumbbellCount: set.dumbbellCount ?? 2,
  };
}

async function removeSet(workoutExerciseId: string, setId: string) {
  try {
    await showConfirmDialog({
      title: t('workout.removeSetTitle'),
      confirmButtonText: t('workout.remove'),
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  workoutStore.removeSet(currentDate.value, workoutExerciseId, setId);
}

async function removeExercise(workoutExerciseId: string) {
  try {
    await showConfirmDialog({
      title: t('workout.removeExerciseTitle'),
      message: t('workout.removeExerciseMessage'),
      confirmButtonText: t('workout.remove'),
      confirmButtonColor: '#ee0a24',
    });
  } catch {
    return;
  }
  workoutStore.removeExercise(currentDate.value, workoutExerciseId);
}
</script>

<style scoped lang="scss">
.workout-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;

    &.slide-left-enter-active,
    &.slide-left-leave-active,
    &.slide-right-enter-active,
    &.slide-right-leave-active {
      transition:
        transform 0.2s ease,
        opacity 0.2s ease;
    }

    &.slide-left-enter-from {
      transform: translateX(24px);
      opacity: 0;
    }
    &.slide-left-leave-to {
      transform: translateX(-24px);
      opacity: 0;
    }

    &.slide-right-enter-from {
      transform: translateX(-24px);
      opacity: 0;
    }
    &.slide-right-leave-to {
      transform: translateX(24px);
      opacity: 0;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
  }

  &__block {
    &.is-dragging {
      opacity: 0.6;
    }

    // One shared container for all the superset's cards: accent bar on the left, cards
    // stacked flush with a divider instead of the usual gap and individual rounding.
    &.is-superset {
      background: var(--van-background-2);
      border-radius: 14px;
      border-inline-start: 3px solid var(--van-primary-color);
      overflow: hidden;

      :deep(.exercise-card) {
        border-radius: 0;
        background: transparent;
      }

      :deep(.exercise-card + .exercise-card) {
        border-block-start: 1px solid var(--van-border-color);
      }
    }
  }

  &__superset-label {
    padding: 10px 14px 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--van-primary-color);
    user-select: none;
  }

  &__summary {
    text-align: center;
    padding: 16px;
    font-size: 13px;
    color: var(--van-text-color-2);
  }
}
</style>
