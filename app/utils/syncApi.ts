import type {
  Workout,
  MuscleGroup,
  Exercise,
  TrackingType,
  EquipmentType,
} from '~~/types';
import { apiFetch, ApiError } from '@/utils/api';
import { getMediaBlob } from '@/utils/mediaStorage';
import { useAuthStore } from '@/stores/auth';
import { useWorkoutStore } from '@/stores/workout';
import { useCatalogStore } from '@/stores/catalog';
import { useSyncStore } from '@/stores/sync';

interface WireCustomMuscleGroup {
  id: string;
  name: string;
  order: number;
  isDeleted: boolean;
  updatedAt: string;
}

interface WireCustomExercise {
  id: string;
  muscleGroupId: string;
  name: string;
  equipment?: EquipmentType;
  trackingType: TrackingType;
  order?: number;
  mediaId?: string; // just the id — the image itself goes through PUT /media/:id
  isDeleted: boolean;
  updatedAt: string;
}

interface WireCatalogOrder {
  groupOrder: string[];
  exerciseOrder: Record<string, string[]>;
  updatedAt: string;
}

interface PushResponse {
  accepted: string[];
  rejected: { id: string; reason: string; current: unknown }[];
  serverTime: string;
}

interface PullResponse {
  workouts: Workout[];
  customMuscleGroups: WireCustomMuscleGroup[];
  customExercises: WireCustomExercise[];
  catalogOrder: WireCatalogOrder | null;
  serverTime: string;
}

const NEVER = new Date(0).toISOString();

function toWireMuscleGroup(group: MuscleGroup): WireCustomMuscleGroup {
  return {
    id: group.id,
    name: group.name,
    order: group.order,
    isDeleted: group.isDeleted ?? false,
    updatedAt: group.updatedAt ?? NEVER,
  };
}

function toWireExercise(exercise: Exercise): WireCustomExercise {
  return {
    id: exercise.id,
    muscleGroupId: exercise.muscleGroupId,
    name: exercise.name,
    equipment: exercise.equipment,
    trackingType: exercise.trackingType,
    order: exercise.order,
    mediaId: exercise.mediaId,
    isDeleted: exercise.isDeleted ?? false,
    updatedAt: exercise.updatedAt ?? NEVER,
  };
}

async function uploadMedia(exercises: Exercise[]): Promise<void> {
  for (const exercise of exercises) {
    if (!exercise.mediaId) continue;
    const blob = await getMediaBlob(exercise.mediaId);
    if (!blob) continue; // not on this device (arrived via sync) — nothing to upload

    const form = new FormData();
    form.append('file', blob, `${exercise.mediaId}.webp`);
    try {
      await apiFetch(`/media/${exercise.mediaId}`, {
        method: 'PUT',
        body: form,
        auth: true,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        continue;
      }
      throw err;
    }
  }
}

function fromWireMuscleGroup(wire: WireCustomMuscleGroup): MuscleGroup {
  return { ...wire, isCustom: true };
}

function fromWireExercise(wire: WireCustomExercise): Exercise {
  return { ...wire, isCustom: true };
}

function isNewerThan(updatedAt: string, cutoff: string): boolean {
  return !cutoff || updatedAt > cutoff;
}

function applyRejected(rejected: PushResponse['rejected']): void {
  if (!rejected.length) return;
  const authStore = useAuthStore();
  const workoutStore = useWorkoutStore();
  const catalogStore = useCatalogStore();

  for (const item of rejected) {
    if (authStore.userId && item.id === authStore.userId) {
      catalogStore.setCatalogOrder(item.current as WireCatalogOrder);
      continue;
    }
    if (workoutStore.workouts.some((w) => w.id === item.id)) {
      workoutStore.replaceWorkout(item.current as Workout);
      continue;
    }
    if (catalogStore.customMuscleGroups.some((g) => g.id === item.id)) {
      catalogStore.replaceMuscleGroup(
        fromWireMuscleGroup(item.current as WireCustomMuscleGroup),
      );
      continue;
    }
    if (catalogStore.customExercises.some((e) => e.id === item.id)) {
      catalogStore.replaceExercise(
        fromWireExercise(item.current as WireCustomExercise),
      );
    }
  }
}

async function pushLocalData(): Promise<void> {
  const workoutStore = useWorkoutStore();
  const catalogStore = useCatalogStore();
  const syncStore = useSyncStore();
  const cutoff = syncStore.lastSyncedAt;

  const changedWorkouts = workoutStore.workouts.filter((w) =>
    isNewerThan(w.updatedAt, cutoff),
  );
  const changedGroups = catalogStore.customMuscleGroups.filter((g) =>
    isNewerThan(g.updatedAt ?? NEVER, cutoff),
  );
  const changedExercises = catalogStore.customExercises.filter((e) =>
    isNewerThan(e.updatedAt ?? NEVER, cutoff),
  );
  await uploadMedia(changedExercises);

  const body: Record<string, unknown> = {};
  if (cutoff) body.lastSyncedAt = cutoff;
  if (changedWorkouts.length) body.workouts = changedWorkouts;
  if (changedGroups.length) {
    body.customMuscleGroups = changedGroups.map(toWireMuscleGroup);
  }
  if (changedExercises.length) {
    body.customExercises = changedExercises.map(toWireExercise);
  }
  if (
    catalogStore.catalogOrderUpdatedAt &&
    isNewerThan(catalogStore.catalogOrderUpdatedAt, cutoff)
  ) {
    body.catalogOrder = {
      groupOrder: catalogStore.groupOrder,
      exerciseOrder: catalogStore.exerciseOrder,
      updatedAt: catalogStore.catalogOrderUpdatedAt,
    };
  }

  if (Object.keys(body).length === 0) return;

  const res = await apiFetch<PushResponse>('/sync/push', {
    method: 'POST',
    body,
    auth: true,
  });
  applyRejected(res.rejected);
}

async function pullRemoteData(): Promise<void> {
  const syncStore = useSyncStore();
  const workoutStore = useWorkoutStore();
  const catalogStore = useCatalogStore();

  const looksWiped =
    !!syncStore.lastSyncedAt &&
    workoutStore.workouts.length === 0 &&
    catalogStore.customMuscleGroups.length === 0 &&
    catalogStore.customExercises.length === 0;

  const query =
    syncStore.lastSyncedAt && !looksWiped
      ? `?since=${encodeURIComponent(syncStore.lastSyncedAt)}`
      : '';
  const res = await apiFetch<PullResponse>(`/sync/pull${query}`, {
    auth: true,
  });

  res.workouts.forEach((w) => workoutStore.replaceWorkout(w));
  res.customMuscleGroups.forEach((g) =>
    catalogStore.replaceMuscleGroup(fromWireMuscleGroup(g)),
  );
  res.customExercises.forEach((e) =>
    catalogStore.replaceExercise(fromWireExercise(e)),
  );
  if (res.catalogOrder) catalogStore.setCatalogOrder(res.catalogOrder);

  syncStore.lastSyncedAt = res.serverTime;
}

let syncInFlight: Promise<void> | null = null;

export function runFullSync(): Promise<void> {
  if (!syncInFlight) {
    syncInFlight = doRunFullSync().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

async function doRunFullSync(): Promise<void> {
  const syncStore = useSyncStore();
  syncStore.syncing = true;
  syncStore.lastSyncError = null;
  try {
    await pushLocalData();
    await pullRemoteData();
  } catch (err) {
    syncStore.lastSyncError = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    syncStore.syncing = false;
  }
}
