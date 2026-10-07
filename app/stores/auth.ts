import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useAuthStore = defineStore('auth', () => {
  const userEmail = useStorage<string | null>('lift-tracker-user-email', null);
  const userId = useStorage<string | null>('lift-tracker-user-id', null);
  const refreshToken = useStorage<string | null>(
    'lift-tracker-refresh-token',
    null,
  );
  const accessToken = ref<string | null>(null);

  const isAuthenticated = computed(() => userEmail.value !== null);

  function setSession(session: {
    accessToken: string;
    refreshToken: string;
    email: string;
    userId: string;
  }): void {
    accessToken.value = session.accessToken;
    refreshToken.value = session.refreshToken;
    userEmail.value = session.email;
    userId.value = session.userId;
  }

  function clearSession(): void {
    accessToken.value = null;
    refreshToken.value = null;
    userEmail.value = null;
    userId.value = null;
  }

  return {
    userEmail,
    userId,
    refreshToken,
    accessToken,
    isAuthenticated,
    setSession,
    clearSession,
  };
});
