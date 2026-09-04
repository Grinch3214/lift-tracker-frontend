<template>
  <div class="limit-gate">
    <van-button
      v-if="!guestStore.isGuestLimitReached || authStore.isAuthenticated"
      type="primary"
      icon="plus"
      size="small"
      class="limit-gate__fab"
      @click="uiStore.exercisePicker.show = true"
    />
    <button
      v-else
      type="button"
      class="limit-gate__banner"
      @click="openAuthModal"
    >
      <van-icon name="warning-o" size="18" class="limit-gate__banner-icon" />
      <span class="limit-gate__banner-text">
        <span class="limit-gate__banner-title">{{
          t('guest.limitBanner')
        }}</span>
        <span class="limit-gate__banner-hint">{{
          t('guest.limitBannerHint')
        }}</span>
      </span>
      <van-icon name="arrow" size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';
import { useGuestStore } from '@/stores/guest';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const uiStore = useUiStore();
const guestStore = useGuestStore();
const authStore = useAuthStore();

function openAuthModal() {
  uiStore.authModal = { show: true, initialMode: 'register' };
}
</script>

<style scoped lang="scss">
.limit-gate {
  &__fab {
    width: 48px;
    height: 48px;
    position: fixed;
    z-index: 4;
    inset-block-end: calc(var(--van-tabbar-height, 50px) + 24px);
    inset-inline-end: 24px;
    box-shadow: 0 4px 16px rgb(var(--van-primary-color-channels) / 40%);
  }

  &__banner {
    position: fixed;
    z-index: 4;
    inset-block-end: calc(var(--van-tabbar-height, 50px) + 12px);
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
  }

  &__banner-icon {
    flex-shrink: 0;
  }

  &__banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: start;
  }

  &__banner-title {
    font-size: 14px;
    font-weight: 700;
  }

  &__banner-hint {
    font-size: 12px;
    opacity: 0.85;
  }
}
</style>
