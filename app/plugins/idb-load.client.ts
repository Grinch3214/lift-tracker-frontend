import { useWorkoutStore } from '@/stores/workout';
import { useCatalogStore } from '@/stores/catalog';

export default defineNuxtPlugin(async () => {
  await Promise.all([useWorkoutStore().load(), useCatalogStore().load()]);
});
