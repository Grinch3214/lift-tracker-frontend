<template>
  <div class="exercise-card">
    <div class="exercise-card__header">
      <div class="exercise-card__title-row">
        <WorkoutExerciseMedia
          v-if="hasExerciseMedia(exercise)"
          :exercise="exercise"
        />
        <span class="exercise-card__name">
          {{ exerciseName(exercise, t) }}
          <template v-if="exercise.equipment">
            <span class="dot">· </span>
            <span class="exercise-card__equipment">{{
              equipmentLabel(exercise, t)
            }}</span>
          </template>
        </span>
      </div>
      <van-popover
        v-model:show="showMenu"
        :actions="menuActions"
        placement="bottom-end"
        overlay
        :overlay-style="{ background: 'transparent' }"
        class="exercise-card__menu"
        @select="onMenuSelect"
      >
        <template #reference>
          <van-icon
            name="ellipsis"
            size="18"
            color="#888"
            class="exercise-card__menu-btn"
          />
        </template>
      </van-popover>
    </div>

    <div v-if="isTimeDistance" class="exercise-card__sets-header">
      <span>{{ t('workout.setsHeaderSet') }}</span>
      <span>{{ t('workout.setsHeaderDuration') }}</span>
      <span>{{ t('workout.setsHeaderDistance') }}</span>
      <span />
      <span />
    </div>
    <div v-else class="exercise-card__sets-header">
      <span>{{ t('workout.setsHeaderSet') }}</span>
      <span>{{ t('workout.setsHeaderWeight') }}</span>
      <span>{{ t('workout.setsHeaderReps') }}</span>
      <span>{{ t('workout.setsHeaderVol') }}</span>
      <span />
    </div>

    <div
      v-for="(set, i) in workoutExercise.sets"
      :key="set.id"
      class="exercise-card__set-row"
      :class="{ 'is-pr': isPR(set) }"
      @click="$emit('editSet', set)"
    >
      <span class="exercise-card__set-num">{{ i + 1 }}</span>
      <template v-if="isTimeDistance">
        <span class="exercise-card__set-weight">
          {{ (set.durationSeconds ?? 0) / 60 }} {{ t('units.min') }}
        </span>
        <span class="exercise-card__set-reps">
          {{ set.distanceKm ?? 0 }} {{ t('units.km') }}
        </span>
        <span class="exercise-card__set-vol" />
      </template>
      <template v-else>
        <span class="exercise-card__set-weight">
          {{
            isBodyweight(set.weight ?? 0)
              ? t('units.bodyweight')
              : `${set.weight} ${t('units.kg')}`
          }}
          <span v-if="isPR(set)" class="exercise-card__pr-badge">{{
            t('workout.prBadge')
          }}</span>
        </span>
        <span class="exercise-card__set-reps">{{ set.reps }}</span>
        <span class="exercise-card__set-vol">{{
          (set.weight ?? 0) * (set.dumbbellCount ?? 1) * (set.reps ?? 0)
        }}</span>
      </template>
      <van-icon
        name="cross"
        size="13"
        color="#666"
        @click.stop="$emit('deleteSet', set.id)"
      />
    </div>

    <div
      v-if="workoutExercise.sets.length === 0"
      class="exercise-card__no-sets"
    >
      {{ t('workout.noSets') }}
    </div>

    <div class="exercise-card__add-set-btn" @click="$emit('addSet')">
      <van-icon name="plus" size="14" />
      <span>{{ t('workout.addSet') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PopoverAction } from 'vant';
import type { Exercise, WorkoutExercise, SetEntry } from '~~/types';
import { useWorkoutStore } from '@/stores/workout';
import { isBodyweight } from '@/utils/format';
import {
  exerciseName,
  equipmentLabel,
  hasExerciseMedia,
} from '@/utils/exercises';

const props = defineProps<{
  exercise: Exercise;
  workoutExercise: WorkoutExercise;
  // False when nothing sits below this exercise's block (last one in the day) — hides
  // "superset with next", there's nothing to link to.
  canLinkNext: boolean;
}>();

const emit = defineEmits<{
  addSet: [];
  editSet: [set: SetEntry];
  deleteSet: [setId: string];
  deleteExercise: [];
  linkNext: [];
  unlinkSuperset: [];
}>();

const { t } = useI18n();
const workoutStore = useWorkoutStore();

// ---- "⋯" menu ----
type MenuActionKey = 'linkNext' | 'unlinkSuperset' | 'delete';

const showMenu = ref(false);

const menuActions = computed<(PopoverAction & { key: MenuActionKey })[]>(() => [
  ...(props.canLinkNext
    ? [{ key: 'linkNext' as const, text: t('workout.supersetWithNext') }]
    : []),
  ...(props.workoutExercise.supersetId
    ? [{ key: 'unlinkSuperset' as const, text: t('workout.unlinkSuperset') }]
    : []),
  { key: 'delete', text: t('workout.remove'), color: '#ee0a24' },
]);

function onMenuSelect(action: PopoverAction) {
  const key = (action as PopoverAction & { key: MenuActionKey }).key;
  if (key === 'linkNext') emit('linkNext');
  else if (key === 'unlinkSuperset') emit('unlinkSuperset');
  else emit('deleteExercise');
}

const isTimeDistance = computed(
  () => props.exercise.trackingType === 'time-distance',
);

const prWeight = computed(() => {
  if (isTimeDistance.value) return 0;
  const history = workoutStore.getExerciseHistory(props.exercise.id);
  if (!history.length) return 0;
  return Math.max(...history.map((h) => h.maxWeight));
});

const prSetId = computed(() => {
  if (prWeight.value <= 0) return null;
  const qualifying = props.workoutExercise.sets.filter(
    (s) => (s.weight ?? 0) > 0 && (s.weight ?? 0) >= prWeight.value,
  );
  return qualifying.length > 0 ? qualifying[qualifying.length - 1]!.id : null;
});

function isPR(set: SetEntry): boolean {
  return set.id === prSetId.value;
}
</script>

<style scoped lang="scss">
.exercise-card {
  background: var(--van-background-2);
  border-radius: 14px;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    padding: 14px 14px 10px;
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    color: var(--van-text-color);
    user-select: none;
  }

  &__equipment {
    font-weight: 400;
    opacity: 0.6;
  }

  &__menu {
    --van-popover-action-width: auto;
    white-space: nowrap;
  }

  &__menu-btn {
    padding: 0 6px 6px;
    cursor: pointer;
  }

  &__sets-header {
    display: grid;
    grid-template-columns: 36px 1fr 1fr 1fr 28px;
    padding: 4px 14px;
    font-size: 11px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-block-start: 1px solid var(--van-border-color);
  }

  &__set-row {
    display: grid;
    grid-template-columns: 36px 1fr 1fr 1fr 28px;
    align-items: center;
    padding: 10px 14px;
    border-block-start: 1px solid var(--van-border-color);
    cursor: pointer;
    transition: background 0.15s;

    &.is-pr {
      background: rgba(255, 193, 7, 0.06);
    }
  }

  &__set-num {
    font-size: 13px;
    color: var(--van-text-color-2);
  }

  &__set-weight {
    font-size: 15px;
    font-weight: 600;
    color: var(--van-text-color);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__pr-badge {
    font-size: 9px;
    font-weight: 700;
    color: #ffc107;
    background: rgba(255, 193, 7, 0.15);
    border-radius: 4px;
    padding: 1px 4px;
    user-select: none;
  }

  &__set-reps,
  &__set-vol {
    font-size: 14px;
    color: var(--van-text-color);
  }

  &__set-vol {
    color: var(--van-text-color-2);
    font-size: 13px;
  }

  &__no-sets {
    padding: 12px 14px;
    font-size: 13px;
    color: var(--van-text-color-2);
    border-block-start: 1px solid var(--van-border-color);
    text-align: center;
  }

  &__add-set-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    border-block-start: 1px solid var(--van-border-color);
    color: var(--van-primary-color);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
}
</style>
