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

    <div class="sidebar__color-picker">
      <button
        v-for="color in colorPresets"
        :key="color"
        type="button"
        class="sidebar__color-watch"
        :class="{ active: color === settingsStore.primaryColor }"
        :style="{ backgroundColor: `rgb(${color})` }"
        @click="settingsStore.primaryColor = color"
      />
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { useSettingsStore, colorPresets } from '@/stores/settings';

defineProps<{
  show: boolean;
}>();

defineEmits<{
  'update:show': [value: boolean];
}>();

const { t, locale, locales, setLocale } = useI18n();
const settingsStore = useSettingsStore();

const showTimerModal = ref(false);
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

  &__color-picker {
    display: flex;
    gap: 12px;
    margin-block-start: auto;
    padding: 0 2px 16px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__color-watch {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;

    &.active {
      border-color: var(--van-text-color);
    }
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
