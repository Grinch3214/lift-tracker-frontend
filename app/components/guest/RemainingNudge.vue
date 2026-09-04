<template>
  <Transition name="remaining-nudge">
    <button
      v-if="uiStore.guestNudge.show"
      type="button"
      class="remaining-nudge"
      @click="openAuthModal"
    >
      <van-icon name="clock-o" size="16" class="remaining-nudge__icon" />
      <span class="remaining-nudge__text">
        <span class="remaining-nudge__title">{{ nudgeTitle }}</span>
        <span class="remaining-nudge__hint">{{
          t('guest.limitBannerHint')
        }}</span>
      </span>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';
import { pluralize } from '@/utils/pluralize';

const { t } = useI18n();
const uiStore = useUiStore();

const workoutWord = computed(() =>
  pluralize(uiStore.guestNudge.remaining, {
    one: t('units.workoutWordOne'),
    few: t('units.workoutWordFew'),
    many: t('units.workoutWordMany'),
  }),
);

const nudgeTitle = computed(() =>
  t('guest.nudgeTitle', {
    workouts: t('units.countWord', {
      count: uiStore.guestNudge.remaining,
      word: workoutWord.value,
    }),
  }),
);

function openAuthModal() {
  uiStore.hideGuestNudge();
  uiStore.authModal = { show: true, initialMode: 'register' };
}
</script>

<style scoped lang="scss">
.remaining-nudge {
  position: fixed;
  z-index: 5;
  inset-block-start: calc(env(safe-area-inset-top, 0px) + 12px);
  inset-inline: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: var(--van-primary-color);
  color: #fff;
  box-shadow: 0 4px 16px rgb(var(--van-primary-color-channels) / 40%);
  cursor: pointer;

  &__icon {
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: start;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
  }

  &__hint {
    font-size: 12px;
    opacity: 0.85;
  }

  &.remaining-nudge-enter-active,
  &.remaining-nudge-leave-active {
    transition: all 0.25s ease;
  }
  &.remaining-nudge-enter-from,
  &.remaining-nudge-leave-to {
    transform: translateY(-120%);
    opacity: 0;
  }
}
</style>
