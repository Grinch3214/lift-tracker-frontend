import { ref, watch, type Ref } from 'vue';
import { createStore, get, set } from 'idb-keyval';

const idbStore = createStore('lift-tracker', 'keyval');

export function useIdbStorage<T>(key: string, initial: T) {
  const state = ref(initial) as Ref<T>;

  async function load(): Promise<void> {
    const stored = await get<T>(key, idbStore);
    if (stored !== undefined) state.value = stored;
    watch(
      state,
      (value) => {
        const plain = JSON.parse(JSON.stringify(value)) as T;
        set(key, plain, idbStore).catch((err) => {
          console.error(`[idbStorage] failed to persist "${key}"`, err);
        });
      },
      { deep: true },
    );
  }

  return { state, load };
}
