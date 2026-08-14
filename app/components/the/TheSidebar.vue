<template>
  <van-popup
    :show="show"
    position="left"
    class="sidebar"
    @update:show="$emit('update:show', $event)"
  >
    <van-icon
      name="cross"
      size="18"
      class="sidebar__close-btn"
      @click="$emit('update:show', false)"
    />

    <ul class="sidebar__menu-list">
      <!-- <li v-for="item in menuItems" :key="item.id" @click="selectMenuItem(item)">{{ item.label }}</li> -->
    </ul>

    <!-- <div class="spacer" /> -->

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

const settingsStore = useSettingsStore();
const { locale, locales, setLocale } = useI18n();
</script>

<style scoped lang="scss">
.sidebar {
  width: 80%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  background: var(--van-background-2);

  &__close-btn {
    align-self: flex-end;
    color: var(--van-text-color-2);
    cursor: pointer;
    margin-block-end: 12px;
  }

  &__color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding-block-end: 16px;
  }

  &__color-watch {
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
    flex: 1;
    padding: 8px 0;
    border-radius: 8px;
    border: 1px solid var(--van-border-color);
    background: transparent;
    color: var(--van-text-color-2);
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
