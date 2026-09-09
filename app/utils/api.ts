import { FetchError } from 'ofetch';
import { useAuthStore } from '@/stores/auth';

// Matches Nest's default exception-filter body — see lift-tracker-backend/API.md.
interface ApiErrorBody {
  message?: string | string[];
  statusCode?: number;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toApiError(err: unknown): Error {
  if (err instanceof FetchError) {
    const body = err.data as ApiErrorBody | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? err.message);
    return new ApiError(err.status ?? 0, message);
  }
  return err instanceof Error ? err : new Error(String(err));
}

// Exchanges the persisted refreshToken for a fresh accessToken — the one place this
// happens, called both proactively and reactively by apiFetch below (see both call sites).
//
// Single-flight: the backend rotates the refresh token on every use (the old one stops
// working immediately), so two *concurrent* callers naively both firing POST /auth/refresh
// with the same starting token would race — only one succeeds, the other gets a 401 on an
// already-rotated token and would wrongly clearSession() a still-valid session. With
// several independent cloud-sync triggers (app.vue) each capable of calling this around
// app boot, this stopped being a hypothetical. Concurrent callers now share one in-flight
// promise instead of issuing separate requests.
let refreshInFlight: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefreshAccessToken(): Promise<boolean> {
  const authStore = useAuthStore();
  if (!authStore.refreshToken) return false;
  try {
    const config = useRuntimeConfig();
    const res = await $fetch<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        body: { refreshToken: authStore.refreshToken },
      },
    );
    authStore.accessToken = res.accessToken;
    authStore.refreshToken = res.refreshToken;
    return true;
  } catch {
    authStore.clearSession();
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    // Attaches `Authorization: Bearer <accessToken>` and, on a 401, tries exactly one
    // refresh-then-retry before giving up. Opt-in — /auth/register|login|refresh|logout
    // authenticate via body fields, not a header, and don't need any of this.
    auth?: boolean;
  } = {},
): Promise<T> {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  // Avoids a guaranteed 401 on the very first authenticated call after a reload —
  // accessToken is memory-only (see auth.ts), so it's always null right then, even though
  // a valid refreshToken exists. Proactively exchanging it here, rather than waiting to
  // react to the 401 below, means the first sync trigger to fire after a reload doesn't
  // have to fail once before it succeeds. This is also the only place session restoration
  // happens at all — there's no separate eager "restore on mount" call; the token is
  // simply refreshed the moment something actually needs it.
  if (options.auth && !authStore.accessToken && authStore.refreshToken) {
    await refreshAccessToken();
  }

  function attempt(): Promise<T> {
    const headers: Record<string, string> = {};
    if (options.auth && authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return $fetch<T>(path, {
      baseURL: config.public.apiBaseUrl,
      method: options.method ?? 'GET',
      body: options.body,
      headers,
    });
  }

  try {
    return await attempt();
  } catch (err) {
    if (options.auth && err instanceof FetchError && err.status === 401) {
      if (await refreshAccessToken()) {
        try {
          return await attempt();
        } catch (retryErr) {
          throw toApiError(retryErr);
        }
      }
    }
    throw toApiError(err);
  }
}
