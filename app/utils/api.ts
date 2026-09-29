import { FetchError } from 'ofetch';
import { useAuthStore } from '@/stores/auth';

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
    method?: 'GET' | 'POST' | 'PUT';
    body?: Record<string, unknown> | FormData;
    auth?: boolean;
  } = {},
): Promise<T> {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

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
