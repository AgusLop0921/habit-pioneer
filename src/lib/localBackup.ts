/**
 * localBackup.ts
 *
 * Emergency backup system. Saves a full snapshot of all store data to
 * AsyncStorage before any cloud operation. If something goes wrong,
 * the user can restore from this snapshot.
 *
 * Key: 'habits-pioneer-backup-v1'
 * Format: { savedAt: ISO string, main: {...}, pomodoro: {...}, sleep: {...} }
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_KEY = 'habits-pioneer-backup-v1';

let _mainStore: any = null;
let _pomodoroStore: any = null;
let _sleepStore: any = null;

export function registerBackupStores(main: any, pomodoro: any, sleep: any) {
  _mainStore = main;
  _pomodoroStore = pomodoro;
  _sleepStore = sleep;
}

/** Save a full snapshot of all store data to AsyncStorage. */
export async function saveBackup(): Promise<void> {
  if (!_mainStore || !_pomodoroStore || !_sleepStore) return;

  const main = _mainStore.getState();
  const pomodoro = _pomodoroStore.getState();
  const sleep = _sleepStore.getState();

  const snapshot = {
    savedAt: new Date().toISOString(),
    main: {
      habits: main.habits,
      history: main.history,
      tasks: main.tasks,
      shoppingList: main.shoppingList,
      customCategories: main.customCategories,
      language: main.language,
      themeMode: main.themeMode,
    },
    pomodoro: {
      sessions: pomodoro.sessions,
      settings: pomodoro.settings,
    },
    sleep: {
      isEnrolled: sleep.isEnrolled,
      onboardingDone: sleep.onboardingDone,
      logs: sleep.logs,
    },
  };

  await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
}

/** Read the last saved backup without restoring it. */
export async function getBackupInfo(): Promise<{ savedAt: string; summary: Record<string, number> } | null> {
  const raw = await AsyncStorage.getItem(BACKUP_KEY);
  if (!raw) return null;

  try {
    const snapshot = JSON.parse(raw);
    return {
      savedAt: snapshot.savedAt,
      summary: {
        habits: snapshot.main?.habits?.length ?? 0,
        tasks: snapshot.main?.tasks?.length ?? 0,
        shoppingItems: snapshot.main?.shoppingList?.length ?? 0,
        sleepLogs: Object.keys(snapshot.sleep?.logs ?? {}).length,
        pomodoroSessions: snapshot.pomodoro?.sessions?.length ?? 0,
      },
    };
  } catch {
    return null;
  }
}

/** Restore all store data from the last saved backup. */
export async function restoreFromBackup(): Promise<{ success: boolean; error?: string }> {
  if (!_mainStore || !_pomodoroStore || !_sleepStore) {
    return { success: false, error: 'Stores not registered' };
  }

  const raw = await AsyncStorage.getItem(BACKUP_KEY);
  if (!raw) return { success: false, error: 'No backup found' };

  try {
    const snapshot = JSON.parse(raw);

    if (snapshot.main) {
      _mainStore.setState(snapshot.main);
    }
    if (snapshot.pomodoro) {
      _pomodoroStore.setState(snapshot.pomodoro);
    }
    if (snapshot.sleep) {
      _sleepStore.setState(snapshot.sleep);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to parse backup' };
  }
}

/** Returns true if there is a saved backup. */
export async function hasBackup(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(BACKUP_KEY);
  return raw !== null;
}
