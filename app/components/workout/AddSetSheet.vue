<template>
  <van-popup v-model:show="sheet.show" round class="add-set-sheet">
    <div class="add-set-sheet__header">
      <span class="add-set-sheet__title">{{
        sheet.setId !== null
          ? t('addSetSheet.editTitle')
          : t('addSetSheet.addTitle')
      }}</span>
      <span class="add-set-sheet__exercise-name">{{
        exerciseDisplayName
      }}</span>
    </div>

    <div v-if="prevSession" class="add-set-sheet__prev-info">
      <van-icon name="clock-o" size="13" color="#888" />
      <span>{{
        t('addSetSheet.lastSession', {
          weight: isBodyweight(prevSession.weight ?? 0)
            ? t('units.bodyweight')
            : `${prevSession.weight} ${t('units.kg')}`,
          reps: prevSession.reps,
        })
      }}</span>
    </div>

    <div v-if="isTimeDistance" class="add-set-sheet__inputs-row">
      <div class="add-set-sheet__input-block">
        <label class="add-set-sheet__input-label">{{
          t('addSetSheet.durationLabel')
        }}</label>
        <van-field
          ref="durationFieldRef"
          v-model="durationStr"
          type="number"
          input-align="center"
          placeholder="0"
          class="add-set-sheet__set-input"
        />
      </div>
      <div class="add-set-sheet__input-divider" />
      <div class="add-set-sheet__input-block">
        <label class="add-set-sheet__input-label">{{
          t('addSetSheet.distanceLabel')
        }}</label>
        <van-field
          v-model="distanceStr"
          type="number"
          input-align="center"
          placeholder="0"
          class="add-set-sheet__set-input"
        />
      </div>
    </div>
    <div v-else class="add-set-sheet__inputs-row">
      <div class="add-set-sheet__input-block">
        <label class="add-set-sheet__input-label">{{
          t('addSetSheet.weightLabel')
        }}</label>
        <van-field
          ref="weightFieldRef"
          v-model="weightStr"
          type="number"
          input-align="center"
          placeholder="0"
          class="add-set-sheet__set-input"
        />
      </div>
      <div class="add-set-sheet__input-divider" />
      <div class="add-set-sheet__input-block">
        <label class="add-set-sheet__input-label">{{
          t('addSetSheet.repsLabel')
        }}</label>
        <van-field
          v-model="repsStr"
          type="digit"
          input-align="center"
          placeholder="0"
          class="add-set-sheet__set-input"
        />
      </div>
    </div>

    <div v-if="isDumbbell" class="add-set-sheet__dumbbell-row">
      <span class="add-set-sheet__dumbbell-label">{{
        t('addSetSheet.dumbbellCountLabel')
      }}</span>
      <div class="add-set-sheet__dumbbell-toggle">
        <button
          v-for="count in DUMBBELL_COUNTS"
          :key="count"
          type="button"
          class="add-set-sheet__dumbbell-btn"
          :class="{ active: dumbbellCount === count }"
          @click="dumbbellCount = count"
        >
          ×{{ count }}
        </button>
      </div>
    </div>

    <div class="add-set-sheet__actions">
      <van-button
        plain
        size="large"
        class="add-set-sheet__btn-cancel"
        @click="cancel"
        >{{ t('addSetSheet.cancel') }}</van-button
      >
      <van-button
        type="primary"
        size="large"
        class="add-set-sheet__btn-confirm"
        @click="confirm"
      >
        {{
          sheet.setId !== null
            ? t('addSetSheet.save')
            : t('addSetSheet.addTitle')
        }}
      </van-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';
import { useWorkoutStore } from '@/stores/workout';
import { useSettingsStore } from '@/stores/settings';
import {
  useGuestStore,
  GUEST_WORKOUT_LIMIT,
  GUEST_NUDGE_MILESTONES,
} from '@/stores/guest';
import { useAuthStore } from '@/stores/auth';
import { isBodyweight } from '@/utils/format';
import { getExerciseById, exerciseName } from '@/utils/exercises';

const { t } = useI18n();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();
const settingsStore = useSettingsStore();
const guestStore = useGuestStore();
const authStore = useAuthStore();

const DUMBBELL_COUNTS = [1, 2] as const;
const weightStr = ref('');
const repsStr = ref('');
const durationStr = ref('');
const distanceStr = ref('');
const dumbbellCount = ref<1 | 2>(2);
const weightFieldRef = ref<{ focus: () => void } | null>(null);
const durationFieldRef = ref<{ focus: () => void } | null>(null);

const sheet = computed(() => uiStore.addSetSheet);

const exercise = computed(() =>
  sheet.value.exerciseId ? getExerciseById(sheet.value.exerciseId) : null,
);

const isTimeDistance = computed(
  () => exercise.value?.trackingType === 'time-distance',
);

const isDumbbell = computed(() => exercise.value?.equipment === 'dumbbell');

const exerciseDisplayName = computed(() =>
  exercise.value ? exerciseName(exercise.value, t) : '',
);

const prevSession = computed(() => {
  if (!sheet.value.exerciseId || isTimeDistance.value) return null;
  const history = workoutStore.getExerciseHistory(sheet.value.exerciseId);
  const pastSessions = history.filter((h) => h.date !== sheet.value.date);
  if (!pastSessions.length) return null;
  const last = pastSessions[pastSessions.length - 1];
  return last?.bestSet ?? null;
});

watch(
  () => sheet.value.show,
  (shown) => {
    if (shown) {
      weightStr.value =
        sheet.value.defaultWeight > 0 ? String(sheet.value.defaultWeight) : '';
      repsStr.value =
        sheet.value.defaultReps > 0 ? String(sheet.value.defaultReps) : '';
      durationStr.value =
        sheet.value.defaultDurationSeconds > 0
          ? String(sheet.value.defaultDurationSeconds / 60)
          : '';
      distanceStr.value =
        sheet.value.defaultDistanceKm > 0
          ? String(sheet.value.defaultDistanceKm)
          : '';
      dumbbellCount.value = sheet.value.defaultDumbbellCount;
      nextTick(() =>
        isTimeDistance.value
          ? durationFieldRef.value?.focus()
          : weightFieldRef.value?.focus(),
      );
    }
  },
);

function confirm() {
  let values: {
    weight?: number;
    reps?: number;
    durationSeconds?: number;
    distanceKm?: number;
    dumbbellCount?: 1 | 2;
  };

  if (isTimeDistance.value) {
    const durationMinutes = parseFloat(durationStr.value) || 0;
    if (durationMinutes === 0) return;
    values = {
      durationSeconds: durationMinutes * 60,
      distanceKm: parseFloat(distanceStr.value) || 0,
    };
  } else {
    const reps = parseInt(repsStr.value) || 0;
    if (reps === 0) return;
    values = {
      weight: parseFloat(weightStr.value) || 0,
      reps,
      ...(isDumbbell.value ? { dumbbellCount: dumbbellCount.value } : {}),
    };
  }

  if (sheet.value.setId !== null) {
    workoutStore.updateSet(
      sheet.value.date,
      sheet.value.workoutExerciseId,
      sheet.value.setId,
      values,
    );
  } else {
    const workoutBefore = workoutStore.getWorkoutByDate(sheet.value.date);
    const hadSetsBefore =
      (workoutBefore?.exercises.reduce((sum, e) => sum + e.sets.length, 0) ??
        0) > 0;

    workoutStore.addSet(
      sheet.value.date,
      sheet.value.workoutExerciseId,
      values,
    );
    if (!hadSetsBefore) {
      guestStore.incrementWorkoutCount();
      const remaining = GUEST_WORKOUT_LIMIT - guestStore.guestWorkoutCount;
      if (!authStore.isAuthenticated && GUEST_NUDGE_MILESTONES.includes(remaining)) {
        uiStore.showGuestNudge(remaining);
      }
    }
    if (settingsStore.restTimerMode === 'auto') {
      uiStore.startRestTimer(settingsStore.restTimerDuration);
    }
  }
  uiStore.addSetSheet.show = false;
}

function cancel() {
  uiStore.addSetSheet.show = false;
}
</script>

<style scoped lang="scss">
.add-set-sheet {
  width: min(340px, 90vw);
  padding: 20px 16px;

  &__header {
    padding: 0 0 4px;
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

  &__prev-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 12px;
    color: #888;
    margin-block-end: 16px;
  }

  &__inputs-row {
    display: flex;
    gap: 0;
    margin: 8px 0 20px;
    border: 1px solid var(--van-border-color);
    border-radius: 12px;
    overflow: hidden;
  }

  &__input-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0 8px;
  }

  &__input-label {
    font-size: 11px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-block-end: 4px;
  }

  &__set-input :deep(.van-field__control) {
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    color: var(--van-text-color);
  }

  &__input-divider {
    width: 1px;
    background: var(--van-border-color);
    align-self: stretch;
  }

  &__dumbbell-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 20px;
  }

  &__dumbbell-label {
    font-size: 13px;
    color: var(--van-text-color-2);
  }

  &__dumbbell-toggle {
    display: flex;
    gap: 6px;
  }

  &__dumbbell-btn {
    width: 40px;
    padding: 6px 0;
    border-radius: 8px;
    border: 1px solid var(--van-border-color);
    background: transparent;
    color: var(--van-text-color-2);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &.active {
      background: var(--van-primary-color);
      border-color: var(--van-primary-color);
      color: var(--lt-main-color);
    }
  }

  &__actions {
    display: flex;
    gap: 10px;
  }

  &__btn-cancel {
    flex: 1;
    border-radius: 10px;
  }

  &__btn-confirm {
    flex: 2;
    border-radius: 10px;
  }
}
</style>
