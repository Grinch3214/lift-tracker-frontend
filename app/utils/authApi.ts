import { apiFetch } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useGuestStore } from '@/stores/guest';
import { runFullSync } from '@/utils/syncApi';

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
    userId: res.user.id,
  });
  // Retires guest mode on this device for good — see guest.ts#exhaustLimit(). Covers both
  // register and login since either means "this browser now belongs to a real account".
  useGuestStore().exhaustLimit();
  // First sync is just a regular push+pull, not a special "migrate on registration"
  // endpoint — see lift-tracker-backend/ARCHITECTURE.md section 5. Doesn't block the
  // login/register UX on failure (the user is already authenticated either way); a failed
  // sync here just means their local data stays local until the next successful sync —
  // there's no retry loop yet (that's the deferred "background trigger" question).
  try {
    await runFullSync();
  } catch {
    // Swallowed deliberately — see comment above. sync.ts#lastSyncError still records it.
  }
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
