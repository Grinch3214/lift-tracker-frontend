<template>
  <van-popup v-model:show="sheet.show" round class="add-set-sheet">
    <div class="add-set-sheet__header">
      <span class="add-set-sheet__title">{{
        sheet.setId !== null
          ? t('addSetSheet.editTitle')
          : t('addSetSheet.addTitle')
      }}</span>
      <span class="add-set-sheet__exercise-name">{{ exerciseName }}</span>
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
import { isBodyweight } from '@/utils/format';
import { getExerciseById } from '@/utils/exercises';

const { t } = useI18n();
const uiStore = useUiStore();
const workoutStore = useWorkoutStore();

const weightStr = ref('');
const repsStr = ref('');
const durationStr = ref('');
const distanceStr = ref('');
const weightFieldRef = ref<{ focus: () => void } | null>(null);
const durationFieldRef = ref<{ focus: () => void } | null>(null);

const sheet = computed(() => uiStore.addSetSheet);

const exercise = computed(() =>
  sheet.value.exerciseId ? getExerciseById(sheet.value.exerciseId) : null,
);

const isTimeDistance = computed(
  () => exercise.value?.trackingType === 'time-distance',
);

const exerciseName = computed(() =>
  sheet.value.exerciseId
    ? t(`catalog.exercises.${sheet.value.exerciseId}`)
    : '',
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
    values = { weight: parseFloat(weightStr.value) || 0, reps };
  }

  if (sheet.value.setId !== null) {
    workoutStore.updateSet(
      sheet.value.date,
      sheet.value.workoutExerciseId,
      sheet.value.setId,
      values,
    );
  } else {
    workoutStore.addSet(
      sheet.value.date,
      sheet.value.workoutExerciseId,
      values,
    );
    uiStore.startRestTimer(90);
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
