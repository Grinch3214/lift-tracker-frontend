import type {
  Workout,
  MuscleGroup,
  Exercise,
  TrackingType,
  EquipmentType,
} from '~~/types';
import { apiFetch } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useWorkoutStore } from '@/stores/workout';
import { useCatalogStore } from '@/stores/catalog';
import { useSyncStore } from '@/stores/sync';

// Wire shapes per lift-tracker-backend/API.md. Workout/WorkoutExercise/SetEntry are NOT
// redeclared here — the frontend types already match PushWorkoutDto/WireWorkout field for
// field (that's precisely why Workout.updatedAt was added), so they're sent/received as-is.
// MuscleGroup/Exercise need a thin mapper: the wire form drops `isCustom` (the backend only
// ever deals in custom entries — that's the whole `custom_*` table) and requires
// `isDeleted`/`updatedAt` where the frontend type leaves them optional.
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

// No `updatedAt` means this entry pre-dates that field ever being added — treat it as
// always older than anything the server has, same fallback used by
// catalogStore.replaceMuscleGroup/replaceExercise's own LWW comparison.
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
    isDeleted: exercise.isDeleted ?? false,
    updatedAt: exercise.updatedAt ?? NEVER,
  };
}

function fromWireMuscleGroup(wire: WireCustomMuscleGroup): MuscleGroup {
  return { ...wire, isCustom: true };
}

function fromWireExercise(wire: WireCustomExercise): Exercise {
  return { ...wire, isCustom: true };
}

// Empty cutoff (never synced yet) means "everything is newer" — the first sync has
// nothing to compare against, so it always pushes the full local dataset regardless of
// this filter; only repeat syncs actually shrink. Strict `>`, matching the backend's own
// `MoreThan(sinceDate)` on pull, so a record already accepted as of the last sync (its
// updatedAt <= lastSyncedAt) doesn't get re-sent for no reason.
function isNewerThan(updatedAt: string, cutoff: string): boolean {
  return !cutoff || updatedAt > cutoff;
}

function applyRejected(rejected: PushResponse['rejected']): void {
  if (!rejected.length) return;
  const authStore = useAuthStore();
  const workoutStore = useWorkoutStore();
  const catalogStore = useCatalogStore();

  for (const item of rejected) {
    // catalogOrder's wire `id` is the userId (one row per user server-side), not a
    // client-minted UUID like everything else — that's the only way to recognize it in
    // this flat, mixed-domain id pool (see API.md's "accepted/rejected — общий пул id").
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

  // Only what actually changed since the last successful sync — sending the whole local
  // dataset on every push doesn't scale (a few hundred workouts is already megabytes, and
  // the backend's default body-size limit is smaller than that). The first-ever sync is
  // the one unavoidable exception: isNewerThan() includes everything when cutoff is ''.
  const changedWorkouts = workoutStore.workouts.filter((w) =>
    isNewerThan(w.updatedAt, cutoff),
  );
  const changedGroups = catalogStore.customMuscleGroups.filter((g) =>
    isNewerThan(g.updatedAt ?? NEVER, cutoff),
  );
  const changedExercises = catalogStore.customExercises.filter((e) =>
    isNewerThan(e.updatedAt ?? NEVER, cutoff),
  );

  const body: Record<string, unknown> = {};
  if (cutoff) body.lastSyncedAt = cutoff;
  if (changedWorkouts.length) body.workouts = changedWorkouts;
  if (changedGroups.length) {
    body.customMuscleGroups = changedGroups.map(toWireMuscleGroup);
  }
  if (changedExercises.length) {
    body.customExercises = changedExercises.map(toWireExercise);
  }
  // Empty string means "never reordered anything" — nothing to push, and there's no
  // meaningful updatedAt to send anyway.
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

  // We've synced before (lastSyncedAt is set) but local data is implausibly empty across
  // every domain — almost certainly localStorage was lost independent of any real sync
  // event (cleared in devtools, browser storage eviction, private-mode cleanup, etc.), not
  // a legitimate "nothing here" state. An incremental `since` pull would trust that
  // emptiness and never re-fetch anything with an updatedAt older than lastSyncedAt,
  // permanently orphaning data that's still safe on the server (the actual bug: it *looks*
  // like the server got wiped, but push never sends destructive "replace everything"
  // semantics — pull just silently stops asking for data it wrongly believes is already
  // known locally). Force a full pull to recover it. Workouts have no deletion sync at all
  // yet (see CLAUDE.md), so "genuinely 0 workouts after having synced before" can't
  // actually happen through normal use — this has no real false-positive cost.
  const looksWiped =
    !!syncStore.lastSyncedAt &&
    workoutStore.workouts.length === 0 &&
    catalogStore.customMuscleGroups.length === 0 &&
    catalogStore.customExercises.length === 0;

  const query = syncStore.lastSyncedAt && !looksWiped
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

// The client-side half of the flow documented in lift-tracker-backend/ARCHITECTURE.md
// section 5: push local changes -> apply whatever the server rejected as stale (already
// done inside pushLocalData) -> pull with the new `since` -> save serverTime as the next
// lastSyncedAt (done inside pullRemoteData). Called both right after register/login
// (authApi.ts) and by app.vue's background triggers — with several independent triggers,
// two can legitimately fire close together (e.g. login succeeding right as the tab
// visibility changes), so this is single-flight (same pattern as api.ts's
// refreshAccessToken()): a trigger arriving while a sync is already running just awaits
// that same run instead of kicking off a second, overlapping push+pull cycle. Not a
// correctness issue either way (LWW guards on both ends make a redundant concurrent sync
// harmless), just wasted requests worth avoiding.
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
