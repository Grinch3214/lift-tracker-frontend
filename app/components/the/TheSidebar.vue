<template>
  <van-popup
    :show="show"
    position="left"
    class="sidebar"
    @update:show="$emit('update:show', $event)"
  >
    <div class="sidebar__header">
      <div class="sidebar__locale-btns">
        <button
          v-for="loc in locales"
          :key="loc.code"
          type="button"
          class="sidebar__locale-btn"
          :class="{ active: locale === loc.code }"
          @click="setLocale(loc.code)"
        >
          {{ loc.code.toUpperCase() }}
        </button>
      </div>

      <van-icon
        name="cross"
        size="18"
        class="sidebar__close-btn"
        @click="$emit('update:show', false)"
      />
    </div>

    <ul class="sidebar__menu-list">
      <li>
        <button
          type="button"
          class="sidebar__menu-item"
          @click="showTimerModal = true"
        >
          <van-icon name="clock-o" size="16" />
          <span class="sidebar__menu-item-label">{{
            t('restTimer.settingsTitle')
          }}</span>
          <van-icon name="arrow" size="14" class="sidebar__menu-item-arrow" />
        </button>
      </li>
    </ul>

    <TheRestTimerSettingsModal v-model:show="showTimerModal" />

    <ul class="sidebar__menu-list sidebar__menu-list--bottom">
      <li>
        <button
          type="button"
          class="sidebar__menu-item"
          @click="showColorPicker = true"
        >
          <van-icon name="brush-o" size="16" />
          <span class="sidebar__menu-item-label">{{
            t('sidebar.colorMenuLabel')
          }}</span>
          <van-icon name="arrow" size="14" class="sidebar__menu-item-arrow" />
        </button>
      </li>
      <li v-if="!authStore.isAuthenticated">
        <button
          type="button"
          class="sidebar__menu-item"
          @click="uiStore.authModal = { show: true, initialMode: 'login' }"
        >
          <van-icon name="user-o" size="16" />
          <span class="sidebar__menu-item-label">{{
            t('sidebar.loginMenuLabel')
          }}</span>
          <van-icon name="arrow" size="14" class="sidebar__menu-item-arrow" />
        </button>
      </li>
      <li v-else class="sidebar__account-row">
        <span class="sidebar__account-email">{{ authStore.userEmail }}</span>
        <button
          type="button"
          class="sidebar__account-logout"
          @click="logoutUser()"
        >
          <van-icon name="revoke" size="14" />
          {{ t('sidebar.logout') }}
        </button>
      </li>
    </ul>

    <van-popup
      v-model:show="showColorPicker"
      position="bottom"
      round
      teleport="body"
    >
      <van-picker
        :columns="colorPickerColumns"
        :model-value="[settingsStore.primaryColor]"
        @change="onColorChange"
        @confirm="showColorPicker = false"
        @cancel="showColorPicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import type { PickerChangeEventParams } from 'vant';
import { useSettingsStore, colorPresets } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { logoutUser } from '@/utils/authApi';

defineProps<{
  show: boolean;
}>();

defineEmits<{
  'update:show': [value: boolean];
}>();

const { t, locale, locales, setLocale } = useI18n();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const authStore = useAuthStore();

const showTimerModal = ref(false);
const showColorPicker = ref(false);

const colorPickerColumns = computed(() =>
  colorPresets.map((color) => ({
    text: t(color.labelKey),
    value: color.value,
  })),
);

function onColorChange({ selectedOptions }: PickerChangeEventParams) {
  const value = selectedOptions[0]?.value;
  if (typeof value === 'string') settingsStore.primaryColor = value;
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 80%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  background: var(--van-background-2);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 12px;
  }

  &__close-btn {
    color: var(--van-text-color-2);
    cursor: pointer;
  }

  &__menu-list {
    display: flex;
    flex-direction: column;
    margin-block-end: 8px;
  }

  &__menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 4px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--van-text-color);
    font-size: 14px;
    cursor: pointer;
  }

  &__menu-item-label {
    flex: 1;
    text-align: start;
  }

  &__menu-item-arrow {
    color: var(--van-text-color-2);
  }

  &__menu-list--bottom {
    margin-block-start: auto;
    margin-block-end: 0;
  }

  &__account-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 4px;
  }

  &__account-email {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--van-text-color-2);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__account-logout {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--van-text-color-2);
    font-size: 13px;
    cursor: pointer;
  }

  &__locale-btns {
    display: flex;
    gap: 8px;
  }

  &__locale-btn {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--van-border-color);
    background: transparent;
    color: var(--van-text-color-2);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;

    &.active {
      background: var(--van-primary-color);
      border-color: var(--van-primary-color);
      color: var(--lt-main-color);
    }
  }
}
</style>
