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

  // Called once, the moment register/login ever succeeds on this device (see
  // authApi.ts#authenticate) — permanently retires guest mode here, regardless of the
  // real count. Without this, logging out on a device that was never used as a guest
  // (count still 0 — a fresh browser profile, or one that went straight to login) would
  // hand a real, already-registered user a fresh 10-workout guest allowance post-logout.
  // Math.max, not a plain set, so it's a no-op if the count already exceeds the limit.
  function exhaustLimit(): void {
    guestWorkoutCount.value = Math.max(guestWorkoutCount.value, GUEST_WORKOUT_LIMIT);
  }

  return {
    guestWorkoutCount,
    isGuestLimitReached,
    incrementWorkoutCount,
    exhaustLimit,
  };
});
