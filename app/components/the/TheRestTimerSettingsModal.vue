<template>
  <van-popup
    :show="show"
    round
    teleport="body"
    class="rest-timer-settings-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="rest-timer-settings-modal__header">
      <span class="rest-timer-settings-modal__title">{{
        t('restTimer.settingsTitle')
      }}</span>
      <van-icon
        name="cross"
        size="16"
        class="rest-timer-settings-modal__close-btn"
        @click="$emit('update:show', false)"
      />
    </div>

    <div class="rest-timer-settings-modal__mode-row">
      <button
        v-for="mode in restTimerModes"
        :key="mode"
        type="button"
        class="rest-timer-settings-modal__mode-btn"
        :class="{ active: settingsStore.restTimerMode === mode }"
        @click="settingsStore.restTimerMode = mode"
      >
        {{ t(restTimerModeLabelKeys[mode]) }}
      </button>
    </div>

    <div
      v-if="settingsStore.restTimerMode !== 'off'"
      class="rest-timer-settings-modal__duration-row"
    >
      <button
        type="button"
        class="rest-timer-settings-modal__stepper-btn"
        @click="adjustDuration(-5)"
      >
        −
      </button>
      <div class="rest-timer-settings-modal__duration-inputs">
        <div class="rest-timer-settings-modal__duration-block">
          <van-field
            v-model="minutesInput"
            type="digit"
            input-align="center"
            class="rest-timer-settings-modal__duration-field"
            @blur="commitDuration"
          />
          <span class="rest-timer-settings-modal__duration-label">{{
            t('units.min')
          }}</span>
        </div>
        <div class="rest-timer-settings-modal__duration-divider" />
        <div class="rest-timer-settings-modal__duration-block">
          <van-field
            v-model="secondsInput"
            type="digit"
            input-align="center"
            class="rest-timer-settings-modal__duration-field"
            @blur="commitDuration"
          />
          <span class="rest-timer-settings-modal__duration-label">{{
            t('units.sec')
          }}</span>
        </div>
      </div>
      <button
        type="button"
        class="rest-timer-settings-modal__stepper-btn"
        @click="adjustDuration(5)"
      >
        +
      </button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import type { RestTimerMode } from '~~/types';
import { useSettingsStore } from '@/stores/settings';

defineProps<{
  show: boolean;
}>();

defineEmits<{
  'update:show': [value: boolean];
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();

const restTimerModes: RestTimerMode[] = ['off', 'auto', 'custom'];
const restTimerModeLabelKeys: Record<RestTimerMode, string> = {
  off: 'restTimer.modeOff',
  auto: 'restTimer.modeAuto',
  custom: 'restTimer.modeCustom',
};

const minutesInput = ref(
  String(Math.floor(settingsStore.restTimerDuration / 60)),
);
const secondsInput = ref(String(settingsStore.restTimerDuration % 60));

watch(
  () => settingsStore.restTimerDuration,
  (value) => {
    minutesInput.value = String(Math.floor(value / 60));
    secondsInput.value = String(value % 60);
  },
);

function commitDuration() {
  const minutes = Math.max(0, parseInt(minutesInput.value) || 0);
  const seconds = Math.max(0, parseInt(secondsInput.value) || 0);
  const total = Math.max(5, minutes * 60 + seconds);
  settingsStore.restTimerDuration = total;
  minutesInput.value = String(Math.floor(total / 60));
  secondsInput.value = String(total % 60);
}

function adjustDuration(delta: number) {
  settingsStore.restTimerDuration = Math.max(
    5,
    settingsStore.restTimerDuration + delta,
  );
}
</script>

<style scoped lang="scss">
.rest-timer-settings-modal {
  width: min(320px, 90vw);
  padding: 20px 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--van-text-color);
  }

  &__close-btn {
    color: var(--van-text-color-2);
    cursor: pointer;
  }

  &__mode-row {
    display: flex;
    gap: 8px;
    margin-block-end: 16px;
  }

  &__mode-btn {
    flex: 1;
    padding: 8px 0;
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

  &__duration-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__stepper-btn {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid var(--van-border-color);
    background: transparent;
    color: var(--van-text-color);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  &__duration-inputs {
    flex: 1;
    display: flex;
    border: 1px solid var(--van-border-color);
    border-radius: 10px;
    overflow: hidden;
  }

  &__duration-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 6px;
    row-gap: 2px;
  }

  &__duration-field {
    width: 100%;

    :deep(.van-field__control) {
      font-size: 20px;
      font-weight: 700;
      text-align: center;
      color: var(--van-text-color);
    }
  }

  &__duration-label {
    font-size: 11px;
    color: var(--van-text-color-2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__duration-divider {
    width: 1px;
    background: var(--van-border-color);
    align-self: stretch;
  }
}
</style>
