import { FetchError } from 'ofetch';

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

export async function apiFetch<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
): Promise<T> {
  const config = useRuntimeConfig();
  try {
    return await $fetch<T>(path, {
      baseURL: config.public.apiBaseUrl,
      method: options.method ?? 'GET',
      body: options.body,
    });
  } catch (err) {
    if (err instanceof FetchError) {
      const body = err.data as ApiErrorBody | undefined;
      const message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message ?? err.message);
      throw new ApiError(err.status ?? 0, message);
    }
    throw err;
  }
}
