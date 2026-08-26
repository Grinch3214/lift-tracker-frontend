<template>
  <van-popup
    :show="show"
    round
    class="add-exercise-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="add-exercise-modal__header">
      <span class="add-exercise-modal__title">{{
        isEditing
          ? t('exercisePicker.editExerciseTitle')
          : t('exercisePicker.newExerciseTitle')
      }}</span>
      <span class="add-exercise-modal__group">{{
        t('exercisePicker.exerciseGroupLabel', { group: groupName })
      }}</span>
    </div>

    <van-field
      ref="nameFieldRef"
      v-model="name"
      :placeholder="t('exercisePicker.exerciseNamePlaceholder')"
      class="add-exercise-modal__input"
    />

    <label class="add-exercise-modal__label">{{
      t('exercisePicker.equipmentLabel')
    }}</label>
    <div class="add-exercise-modal__pill-row">
      <button
        v-for="opt in equipmentOptions"
        :key="opt"
        type="button"
        class="add-exercise-modal__pill"
        :class="{ active: equipment === opt }"
        @click="equipment = equipment === opt ? undefined : opt"
      >
        {{ t(`units.equipment.${opt}`) }}
      </button>
    </div>

    <label class="add-exercise-modal__label">{{
      t('exercisePicker.trackingTypeLabel')
    }}</label>
    <div class="add-exercise-modal__pill-row">
      <button
        v-for="opt in trackingTypeOptions"
        :key="opt"
        type="button"
        class="add-exercise-modal__pill"
        :class="{ active: trackingType === opt }"
        @click="trackingType = opt"
      >
        {{ t(trackingTypeLabelKeys[opt]) }}
      </button>
    </div>

    <div class="add-exercise-modal__actions">
      <van-button
        plain
        size="large"
        class="add-exercise-modal__btn-cancel"
        @click="cancel"
        >{{ t('addSetSheet.cancel') }}</van-button
      >
      <van-button
        type="primary"
        size="large"
        class="add-exercise-modal__btn-confirm"
        @click="confirm"
        >{{ isEditing ? t('addSetSheet.save') : t('exercisePicker.add') }}</van-button
      >
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import type { MuscleGroup, Exercise, EquipmentType, TrackingType } from '~~/types';
import { useCatalogStore } from '@/stores/catalog';
import { muscleGroupName } from '@/utils/exercises';

const props = defineProps<{
  show: boolean;
  muscleGroup: MuscleGroup | null;
  editingExercise?: Exercise | null;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const { t } = useI18n();
const catalogStore = useCatalogStore();

// Kept in sync manually with types/equipment-type.ts and types/tracking-type.ts.
const equipmentOptions: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'smith-machine',
  'hammer',
];
const trackingTypeOptions: TrackingType[] = ['weight-reps', 'time-distance'];
const trackingTypeLabelKeys: Record<TrackingType, string> = {
  'weight-reps': 'exercisePicker.trackingTypeWeightReps',
  'time-distance': 'exercisePicker.trackingTypeTimeDistance',
};

const name = ref('');
const equipment = ref<EquipmentType | undefined>(undefined);
const trackingType = ref<TrackingType>('weight-reps');
const nameFieldRef = ref<{ focus: () => void } | null>(null);

const groupName = computed(() =>
  props.muscleGroup ? muscleGroupName(props.muscleGroup, t) : '',
);

const isEditing = computed(() => !!props.editingExercise);

watch(
  () => props.show,
  (shown) => {
    if (shown) {
      name.value = props.editingExercise?.name ?? '';
      equipment.value = props.editingExercise?.equipment;
      trackingType.value = props.editingExercise?.trackingType ?? 'weight-reps';
      nextTick(() => nameFieldRef.value?.focus());
    }
  },
);

function confirm() {
  const trimmed = name.value.trim();
  if (!trimmed || !props.muscleGroup) return;
  if (props.editingExercise) {
    catalogStore.updateExercise(props.editingExercise.id, {
      name: trimmed,
      equipment: equipment.value,
      trackingType: trackingType.value,
    });
  } else {
    catalogStore.addExercise(
      trimmed,
      props.muscleGroup.id,
      equipment.value,
      trackingType.value,
    );
  }
  emit('update:show', false);
}

function cancel() {
  emit('update:show', false);
}
</script>

<style scoped lang="scss">
.add-exercise-modal {
  width: min(340px, 90vw);
  padding: 20px 16px;
  max-height: 85vh;
  overflow-y: auto;

  &__header {
    padding: 0 0 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__group {
    font-size: 12px;
    color: var(--van-text-color-2);
  }

  &__input {
    border: 1px solid var(--van-border-color);
    border-radius: 10px;
    margin: 16px 0;
  }

  &__label {
    display: block;
    font-size: 11px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-block-end: 8px;
  }

  &__pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-block-end: 16px;
  }

  &__pill {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--van-border-color);
    background: transparent;
    color: var(--van-text-color-2);
    font-size: 13px;
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
    margin-block-start: 4px;
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
