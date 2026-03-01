/**
 * useHydration — returns `true` once the Zustand persisted store has finished
 * rehydrating from AsyncStorage. Useful to prevent flicker while the store
 * loads initial data.
 *
 * Usage:
 *   const hydrated = useHydration();
 *   if (!hydrated) return <SkeletonLoader />;
 */
import { useEffect, useState } from 'react';
import { useStore } from '@/store';

export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(
    // Synchronously read in case the store already rehydrated (re-render case)
    () => useStore.persist.hasHydrated()
  );

  useEffect(() => {
    // Already hydrated — nothing to wait for
    if (hydrated) return;

    const unsubscribe = useStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Double-check in case it hydrated between the render and this effect
    if (useStore.persist.hasHydrated()) setHydrated(true);

    return unsubscribe;
  }, [hydrated]);

  return hydrated;
}
