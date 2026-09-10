<template>
  <van-tabbar
    :active-color="settingsStore.primaryColorCss"
    inactive-color="#666"
    :border="false"
    placeholder
    class="tab-bar"
    route
  >
    <van-tabbar-item
      v-for="tab in TABS"
      :key="tab.to"
      :icon="tab.icon"
      :to="tab.to"
    >
      {{ t(tab.labelKey) }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const TABS = [
  { icon: 'notes-o', to: '/', labelKey: 'nav.workout' },
  { icon: 'calendar-o', to: '/history', labelKey: 'nav.history' },
] as const;
</script>

<style lang="scss" scoped>
.tab-bar {
  background: var(--van-background-2);
  border-block-start: 1px solid var(--van-border-color);
}
</style>
