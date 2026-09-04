import { apiFetch } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useGuestStore } from '@/stores/guest';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

async function authenticate(
  path: '/auth/register' | '/auth/login',
  email: string,
  password: string,
): Promise<void> {
  const res = await apiFetch<AuthResponse>(path, {
    method: 'POST',
    body: { email, password },
  });
  useAuthStore().setSession({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    email: res.user.email,
  });
  // Retires guest mode on this device for good — see guest.ts#exhaustLimit(). Covers both
  // register and login since either means "this browser now belongs to a real account".
  useGuestStore().exhaustLimit();
}

export function registerUser(email: string, password: string): Promise<void> {
  return authenticate('/auth/register', email, password);
}

export function loginUser(email: string, password: string): Promise<void> {
  return authenticate('/auth/login', email, password);
}

export async function logoutUser(): Promise<void> {
  const authStore = useAuthStore();
  const token = authStore.refreshToken;
  authStore.clearSession();
  if (!token) return;
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: { refreshToken: token },
    });
  } catch {
    // Best-effort — local session is already cleared either way, and /auth/logout is
    // idempotent server-side, so a failed revoke here just leaves that one refresh token
    // valid until its own 30-day expiry rather than breaking the user-visible logout.
  }
}

// Called once from app.vue on mount. If a refresh token survived a reload, exchange it
// for a fresh access token so uiStore.authModal-gated features work without forcing a
// re-login; if the refresh token is itself expired/revoked, fall back to a clean logout.
export async function restoreSession(): Promise<void> {
  const authStore = useAuthStore();
  if (!authStore.refreshToken) return;
  try {
    const res = await apiFetch<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: authStore.refreshToken } },
    );
    authStore.accessToken = res.accessToken;
    authStore.refreshToken = res.refreshToken;
  } catch {
    authStore.clearSession();
  }
}
