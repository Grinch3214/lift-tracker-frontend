import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const GUEST_WORKOUT_LIMIT = 10;
export const GUEST_NUDGE_MILESTONES = [8, 6, 4, 2];

export const useGuestStore = defineStore('guest', () => {
  const guestWorkoutCount = useStorage<number>(
    'lift-tracker-guest-workout-count',
    0,
  );

  const isGuestLimitReached = computed(
    () => guestWorkoutCount.value >= GUEST_WORKOUT_LIMIT,
  );

  function incrementWorkoutCount(): void {
    guestWorkoutCount.value++;
  }

  function exhaustLimit(): void {
    guestWorkoutCount.value = Math.max(
      guestWorkoutCount.value,
      GUEST_WORKOUT_LIMIT,
    );
  }

  return {
    guestWorkoutCount,
    isGuestLimitReached,
    incrementWorkoutCount,
    exhaustLimit,
  };
});
