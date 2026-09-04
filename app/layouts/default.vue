<template>
  <van-config-provider theme="dark" class="default-layout">
    <TheHeader />
    <main>
      <slot />
    </main>
    <TheFooter />

    <GuestLimitGate />

    <WorkoutExercisePicker />
    <WorkoutAddSetSheet />
  </van-config-provider>
</template>

<style scoped lang="scss">
.default-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--lt-main-bg-color);
  color: var(--lt-main-color);
}
main {
  // Reserve space below page content.
  padding-block-end: 60px;
}
</style>
