<template>
  <van-tabbar :active-color="settingsStore.primaryColorCss" inactive-color="#666" :border="false" class="tab-bar" route>
    <van-tabbar-item icon="notes-o" to="/">{{ t('nav.workout') }}</van-tabbar-item>
    <van-tabbar-item icon="calendar-o" to="/history">{{ t('nav.history') }}</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();
const settingsStore = useSettingsStore();
</script>

<style lang="scss" scoped>
.tab-bar {
  background: var(--van-background-2);
  border-block-start: 1px solid var(--van-border-color);
}
</style>
