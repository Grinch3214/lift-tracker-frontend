<template>
  <Transition name="slide-down">
    <div
      v-if="uiStore.restTimer.active"
      class="rest-timer"
      @click="uiStore.stopRestTimer()"
    >
      <van-icon name="clock-o" size="15" />
      <span class="rest-timer__label">{{ t('restTimer.label') }}</span>
      <span class="rest-timer__value">{{ timerDisplay }}</span>
      <div class="rest-timer__bar">
        <div class="rest-timer__bar-fill" :style="{ width: timerProgress + '%' }" />
      </div>
      <van-icon name="cross" size="13" color="#888" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';

const uiStore = useUiStore();
const { t } = useI18n();

const timerDisplay = computed(() => {
  const s = uiStore.restTimer.remaining;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
});

const timerProgress = computed(() => {
  const { remaining, total } = uiStore.restTimer;
  return total > 0 ? (remaining / total) * 100 : 0;
});
</script>

<style scoped lang="scss">
.rest-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgb(var(--van-primary-color-channels) / 12%);
  border-block-end: 1px solid rgb(var(--van-primary-color-channels) / 20%);
  cursor: pointer;
  overflow: hidden;
  position: relative;

  &__label {
    font-size: 13px;
    color: var(--van-text-color-2);
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: var(--van-primary-color);
    min-width: 42px;
  }

  &__bar {
    flex: 1;
    height: 3px;
    background: rgb(var(--van-primary-color-channels) / 20%);
    border-radius: 2px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: var(--van-primary-color);
    border-radius: 2px;
    transition: width 1s linear;
  }

  &.slide-down-enter-active,
  &.slide-down-leave-active {
    transition: all 0.25s ease;
  }
  &.slide-down-enter-from,
  &.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
  }
}
</style>
