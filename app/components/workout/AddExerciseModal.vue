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
      t('exercisePicker.photoLabel')
    }}</label>
    <div class="add-exercise-modal__photo-row">
      <button
        type="button"
        class="add-exercise-modal__photo"
        :class="{ 'has-photo': !!photoPreview }"
        :disabled="processingPhoto"
        @click="fileInputRef?.click()"
      >
        <img v-if="photoPreview" :src="photoPreview" alt="" />
        <van-icon v-else name="photograph" size="24" />
        <div v-if="processingPhoto" class="add-exercise-modal__photo-loading">
          <van-loading size="20" />
        </div>
      </button>
      <button
        v-if="photoPreview && !processingPhoto"
        type="button"
        class="add-exercise-modal__photo-remove"
        @click="removePhoto"
      >
        {{ t('exercisePicker.photoRemove') }}
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        hidden
        @change="onPhotoPicked"
      />
    </div>

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
        :loading="saving"
        :disabled="processingPhoto"
        @click="confirm"
        >{{ isEditing ? t('addSetSheet.save') : t('exercisePicker.add') }}</van-button
      >
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { showToast } from 'vant';
import type { MuscleGroup, Exercise, EquipmentType, TrackingType } from '~~/types';
import { useCatalogStore } from '@/stores/catalog';
import { muscleGroupName } from '@/utils/exercises';
import { generateId } from '@/utils/id';
import { compressImage } from '@/utils/imageCompress';
import { saveMedia, deleteMedia, getMediaUrl } from '@/utils/mediaStorage';

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
  'crossover',
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

// ---- Photo ----
// Nothing touches IndexedDB until confirm: a picked photo lives here as a compressed
// in-memory Blob, so cancelling the modal leaves no orphaned image behind.
const MAX_PHOTO_INPUT_BYTES = 50 * 1024 * 1024; // decoding bigger files risks running out of memory on phones

const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingPhoto = ref<Blob | null>(null);
const photoPreview = ref<string | null>(null);
const photoRemoved = ref(false);
const processingPhoto = ref(false);
const saving = ref(false);
// Only object URLs created here get revoked — the one for an already-saved photo comes
// from mediaStorage's cache and is shared with every thumbnail showing it.
let ownedPreviewUrl: string | null = null;

function setPreview(url: string | null, owned: boolean) {
  if (ownedPreviewUrl) URL.revokeObjectURL(ownedPreviewUrl);
  ownedPreviewUrl = owned ? url : null;
  photoPreview.value = url;
}

async function onPhotoPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // so picking the same file again still fires `change`
  if (!file) return;
  if (file.size > MAX_PHOTO_INPUT_BYTES) {
    showToast(t('exercisePicker.photoError'));
    return;
  }

  processingPhoto.value = true;
  try {
    const blob = await compressImage(file);
    pendingPhoto.value = blob;
    photoRemoved.value = false;
    setPreview(URL.createObjectURL(blob), true);
  } catch {
    // Not an image, or a format this browser can't decode (e.g. HEIC on desktop Chrome).
    showToast(t('exercisePicker.photoError'));
  } finally {
    processingPhoto.value = false;
  }
}

function removePhoto() {
  pendingPhoto.value = null;
  photoRemoved.value = true;
  setPreview(null, false);
}

watch(
  () => props.show,
  async (shown) => {
    if (!shown) {
      setPreview(null, false);
      return;
    }
    name.value = props.editingExercise?.name ?? '';
    equipment.value = props.editingExercise?.equipment;
    trackingType.value = props.editingExercise?.trackingType ?? 'weight-reps';
    pendingPhoto.value = null;
    photoRemoved.value = false;
    setPreview(null, false);
    nextTick(() => nameFieldRef.value?.focus());

    const mediaId = props.editingExercise?.mediaId;
    if (mediaId) {
      const url = await getMediaUrl(mediaId);
      // Don't clobber a photo picked/removed while this was still loading.
      if (!pendingPhoto.value && !photoRemoved.value) setPreview(url, false);
    }
  },
);

async function confirm() {
  const trimmed = name.value.trim();
  if (!trimmed || !props.muscleGroup || saving.value) return;

  saving.value = true;
  try {
    // A photo is never overwritten in place: a new one gets a new mediaId, and the old
    // one (if any) is deleted once the exercise no longer points at it.
    const previousMediaId = props.editingExercise?.mediaId;
    let mediaId = previousMediaId;
    if (pendingPhoto.value) {
      mediaId = generateId();
      await saveMedia(mediaId, pendingPhoto.value);
    } else if (photoRemoved.value) {
      mediaId = undefined;
    }

    if (props.editingExercise) {
      catalogStore.updateExercise(props.editingExercise.id, {
        name: trimmed,
        equipment: equipment.value,
        trackingType: trackingType.value,
        mediaId,
      });
    } else {
      catalogStore.addExercise(
        trimmed,
        props.muscleGroup.id,
        equipment.value,
        trackingType.value,
        mediaId,
      );
    }

    if (previousMediaId && previousMediaId !== mediaId) {
      await deleteMedia(previousMediaId);
    }
    emit('update:show', false);
  } catch {
    showToast(t('exercisePicker.photoError'));
  } finally {
    saving.value = false;
  }
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

  &__photo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block-end: 16px;
  }

  &__photo {
    position: relative;
    flex-shrink: 0;
    inline-size: 72px;
    block-size: 72px;
    border-radius: 12px;
    border: 1px dashed var(--van-border-color);
    background: transparent;
    color: var(--van-text-color-2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    cursor: pointer;

    &.has-photo {
      border-style: solid;
    }

    img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }
  }

  &__photo-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 50%);
  }

  &__photo-remove {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--van-danger-color);
    font-size: 13px;
    cursor: pointer;
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
