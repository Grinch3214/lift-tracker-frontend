<template>
  <van-config-provider theme="dark" class="default-layout">
    <TheHeader />
    <main>
      <slot />
    </main>
    <TheFooter />

    <van-button
      type="primary"
      icon="plus"
      class="add-day"
      @click="uiStore.exercisePicker.show = true"
    />

    <WorkoutExercisePicker />
    <WorkoutAddSetSheet />
    <HistoryExerciseHistoryModal />
  </van-config-provider>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui';

const uiStore = useUiStore();
</script>

<style scoped lang="scss">
.default-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--lt-main-bg-color);
  color: var(--lt-main-color);
}
.add-day {
  --van-button-normal-padding: 0 10px;

  width: 48px;
  height: 48px;
  position: fixed;
  z-index: 4;
  inset-block-end: calc(var(--van-tabbar-height, 50px) + 24px);
  inset-inline-end: 24px;
  box-shadow: 0 4px 16px rgb(var(--van-primary-color-channels) / 40%);
}
</style>
