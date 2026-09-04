import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

// Free workouts allowed before registration is required — see docs/02-mvp.md (v1.3).
export const GUEST_WORKOUT_LIMIT = 10;

// Remaining-count values (GUEST_WORKOUT_LIMIT - guestWorkoutCount) at which
// AddSetSheet.vue shows the "N free workouts left" nudge toast — not every workout,
// just these checkpoints. guestWorkoutCount is monotonic, so each fires at most once
// per guest lifetime.
export const GUEST_NUDGE_MILESTONES = [8, 6, 4, 2];

export const useGuestStore = defineStore('guest', () => {
  // Monotonic — grows when a workout is counted, never decreases on deletion (see
  // incrementWorkoutCount below), so it can't be reset by deleting/recreating a day.
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

  return {
    guestWorkoutCount,
    isGuestLimitReached,
    incrementWorkoutCount,
  };
});
