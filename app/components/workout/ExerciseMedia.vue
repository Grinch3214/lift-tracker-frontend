<template>
  <div class="exercise-media" :class="{ 'is-photo': isPhoto }">
    <img v-if="src" :src="src" alt="" loading="lazy" draggable="false" />
    <svg
      v-else
      class="exercise-media__placeholder"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M3.5 9v6" />
      <path d="M20.5 9v6" />
      <path d="M6.5 12h11" />
      <path d="M3.5 9h3" />
      <path d="M3.5 15h3" />
      <path d="M17.5 9h3" />
      <path d="M17.5 15h3" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~~/types';
import { getMediaUrl } from '@/utils/mediaStorage';

const props = defineProps<{
  exercise?: Exercise;
  src?: string;
}>();

const storedSrc = ref<string | null>(null);

watch(
  () => props.exercise?.mediaId,
  async (mediaId) => {
    storedSrc.value = mediaId ? await getMediaUrl(mediaId) : null;
  },
  { immediate: true },
);

const src = computed(
  () => props.src || props.exercise?.mediaUrl || storedSrc.value || '',
);

const isPhoto = computed(() => !!props.src || !!props.exercise?.mediaId);
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

  &__placeholder {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    padding: 10px;
    box-sizing: border-box;
    color: var(--van-text-color-3);
  }

  &.is-photo img {
    object-fit: cover;
    background: transparent;
  }
}
</style>
