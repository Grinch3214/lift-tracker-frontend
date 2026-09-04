import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useAuthStore = defineStore('auth', () => {
  // TODO(cloud-sync, v1.3): replace with real session state (JWT access token kept in
  // memory, refresh token persisted) once the HTTP client + POST /auth/register|login
  // wiring exist — see lift-tracker-backend/API.md. For now this only tracks whether a
  // logged-in email is set, written directly by AuthModal's stub submit(), so the rest
  // of the UI (sidebar account row, guest gate) can be built and tested ahead of the
  // real network layer.
  const userEmail = useStorage<string | null>('lift-tracker-user-email', null);

  const isAuthenticated = computed(() => userEmail.value !== null);

  function logout(): void {
    userEmail.value = null;
  }

  return {
    userEmail,
    isAuthenticated,
    logout,
  };
});
