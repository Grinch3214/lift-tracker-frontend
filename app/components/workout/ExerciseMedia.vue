<template>
  <div class="exercise-media">
    <img v-if="src" :src="src" alt="" loading="lazy" draggable="false" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string;
}>();
</script>

<style scoped lang="scss">
.exercise-media {
  flex-shrink: 0;
  inline-size: 44px;
  block-size: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: rgb(255 255 255 / 6%);

  img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    background: #fff;
  }
}
</style>
