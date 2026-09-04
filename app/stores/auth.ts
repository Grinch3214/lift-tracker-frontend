import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useAuthStore = defineStore('auth', () => {
  const userEmail = useStorage<string | null>('lift-tracker-user-email', null);
  // Persisted so a page reload doesn't force a fresh login — restoreSession() (app.vue,
  // on mount) exchanges it for a fresh accessToken via POST /auth/refresh.
  const refreshToken = useStorage<string | null>(
    'lift-tracker-refresh-token',
    null,
  );
  // Deliberately NOT persisted (plain ref, not useStorage) — unlike every other bit of
  // state in this app. A 15-minute access token sitting in localStorage is a live-session
  // handout to anything that can read it (XSS); the refresh token above is scoped-purpose
  // and individually revocable via POST /auth/logout, so it's an acceptable exception to
  // this app's usual "everything in localStorage" rule. Cleared on every reload.
  const accessToken = ref<string | null>(null);

  const isAuthenticated = computed(() => userEmail.value !== null);

  function setSession(session: {
    accessToken: string;
    refreshToken: string;
    email: string;
  }): void {
    accessToken.value = session.accessToken;
    refreshToken.value = session.refreshToken;
    userEmail.value = session.email;
  }

  function clearSession(): void {
    accessToken.value = null;
    refreshToken.value = null;
    userEmail.value = null;
  }

  return {
    userEmail,
    refreshToken,
    accessToken,
    isAuthenticated,
    setSession,
    clearSession,
  };
});
