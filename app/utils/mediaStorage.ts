import { createStore, get, set, del } from 'idb-keyval';

const mediaStore = createStore('lift-tracker-media', 'blobs');
const objectUrls = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

export async function saveMedia(mediaId: string, blob: Blob): Promise<void> {
  await set(mediaId, blob, mediaStore);
}

export function getMediaBlob(mediaId: string): Promise<Blob | undefined> {
  return get<Blob>(mediaId, mediaStore);
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const url = objectUrls.get(mediaId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(mediaId);
  }
  await del(mediaId, mediaStore);
}

export function getMediaUrl(mediaId: string): Promise<string | null> {
  const cached = objectUrls.get(mediaId);
  if (cached) return Promise.resolve(cached);

  let pending = inFlight.get(mediaId);
  if (!pending) {
    pending = resolveMediaUrl(mediaId).finally(() => inFlight.delete(mediaId));
    inFlight.set(mediaId, pending);
  }
  return pending;
}

async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  let blob = await getMediaBlob(mediaId);
  if (!blob) {
    blob = (await downloadMedia(mediaId)) ?? undefined;
    if (!blob) return null;
    await saveMedia(mediaId, blob);
  }
  const url = URL.createObjectURL(blob);
  objectUrls.set(mediaId, url);
  return url;
}

async function downloadMedia(mediaId: string): Promise<Blob | null> {
  if (!navigator.onLine) return null;
  try {
    const config = useRuntimeConfig();
    return await $fetch<Blob>(`/media/${mediaId}`, {
      baseURL: config.public.apiBaseUrl,
      responseType: 'blob',
    });
  } catch {
    return null;
  }
}
