/**
 * syncBootstrap.ts
 *
 * Wires up Zustand subscribe listeners for all stores so the sync manager
 * automatically detects state changes and schedules uploads.
 *
 * Call bootstrapSync() once on app start (after stores are hydrated).
 * This keeps all store slice files clean — no sync code touches them.
 */
import { useStore } from '../store';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSleepStore } from '../store/sleepStore';
import { registerStores, scheduleSync } from './syncManager';
import { registerBackupStores, saveBackup } from './localBackup';

let bootstrapped = false;

export function bootstrapSync() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Register stores with the sync manager and backup system
  registerStores(
    useStore as any,
    usePomodoroStore as any,
    useSleepStore as any
  );
  registerBackupStores(
    useStore as any,
    usePomodoroStore as any,
    useSleepStore as any
  );

  // Save a backup on every app start (after hydration) so there's always
  // a recent snapshot before any cloud operation runs.
  void saveBackup();

  // ── Main store listener ───────────────────────────────────────────────────
  // Watch for changes in data fields (skip actions / computed values)
  useStore.subscribe((state, prev) => {
    if (
      state.habits !== prev.habits ||
      state.history !== prev.history ||
      state.tasks !== prev.tasks ||
      state.shoppingList !== prev.shoppingList ||
      state.customCategories !== prev.customCategories ||
      state.language !== prev.language ||
      state.themeMode !== prev.themeMode
    ) {
      scheduleSync();
    }
  });

  // ── Pomodoro store listener ───────────────────────────────────────────────
  usePomodoroStore.subscribe((state, prev) => {
    if (state.sessions !== prev.sessions || state.settings !== prev.settings) {
      scheduleSync();
    }
  });

  // ── Sleep store listener ──────────────────────────────────────────────────
  useSleepStore.subscribe((state, prev) => {
    if (
      state.logs !== prev.logs ||
      state.isEnrolled !== prev.isEnrolled ||
      state.onboardingDone !== prev.onboardingDone
    ) {
      scheduleSync();
    }
  });

  // NOTE: No auto-download on login.
  // downloadAll() must only be called explicitly (e.g. from a "Restore from cloud"
  // button on a new device). Auto-downloading would race with local data and
  // overwrite it with empty Supabase data before migration has a chance to run.
}
