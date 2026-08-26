<template>
  <van-popup
    :show="show"
    round
    class="add-group-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="add-group-modal__header">
      <span class="add-group-modal__title">{{
        isEditing
          ? t('exercisePicker.editGroupTitle')
          : t('exercisePicker.newGroupTitle')
      }}</span>
    </div>

    <van-field
      ref="nameFieldRef"
      v-model="name"
      :placeholder="t('exercisePicker.groupNamePlaceholder')"
      class="add-group-modal__input"
    />

    <div class="add-group-modal__actions">
      <van-button
        plain
        size="large"
        class="add-group-modal__btn-cancel"
        @click="cancel"
        >{{ t('addSetSheet.cancel') }}</van-button
      >
      <van-button
        type="primary"
        size="large"
        class="add-group-modal__btn-confirm"
        @click="confirm"
        >{{ isEditing ? t('addSetSheet.save') : t('exercisePicker.add') }}</van-button
      >
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import type { MuscleGroup } from '~~/types';
import { useCatalogStore } from '@/stores/catalog';

const props = defineProps<{
  show: boolean;
  editingGroup?: MuscleGroup | null;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const { t } = useI18n();
const catalogStore = useCatalogStore();

const name = ref('');
const nameFieldRef = ref<{ focus: () => void } | null>(null);

const isEditing = computed(() => !!props.editingGroup);

watch(
  () => props.show,
  (shown) => {
    if (shown) {
      name.value = props.editingGroup?.name ?? '';
      nextTick(() => nameFieldRef.value?.focus());
    }
  },
);

function confirm() {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  if (props.editingGroup) {
    catalogStore.updateMuscleGroup(props.editingGroup.id, trimmed);
  } else {
    catalogStore.addMuscleGroup(trimmed);
  }
  emit('update:show', false);
}

function cancel() {
  emit('update:show', false);
}
</script>

<style scoped lang="scss">
.add-group-modal {
  width: min(320px, 90vw);
  padding: 20px 16px;

  &__header {
    padding: 0 0 12px;
    text-align: center;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__input {
    border: 1px solid var(--van-border-color);
    border-radius: 10px;
    margin-block-end: 20px;
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
