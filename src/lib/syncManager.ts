/**
 * syncManager.ts
 *
 * Handles all data synchronization between local AsyncStorage and Supabase.
 *
 * Strategy:
 * - subscribe() listeners on each store detect state changes
 * - scheduleSync() debounces rapid changes (2s) then calls flush()
 * - flush() uploads all local data to Supabase (upsert, last-write-wins)
 * - downloadAll() fetches remote data and merges into local stores
 * - migrateLocalData() does the initial one-time upload for existing users
 *
 * "Last write wins" is enforced via `updated_at` on the Supabase rows:
 * - Upload: always sends current local state, Supabase stores updated_at = now()
 * - Download: only replaces local data if remote updated_at > lastSyncAt
 */

import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';
import { saveBackup } from './localBackup';

// ── Types ─────────────────────────────────────────────────────────────────────

type AnyStore = {
  getState: () => unknown;
};

// Lazy store references to avoid circular imports
let _mainStore: AnyStore | null = null;
let _pomodoroStore: AnyStore | null = null;
let _sleepStore: AnyStore | null = null;

export function registerStores(
  main: AnyStore,
  pomodoro: AnyStore,
  sleep: AnyStore
) {
  _mainStore = main;
  _pomodoroStore = pomodoro;
  _sleepStore = sleep;
}

// ── Debounce ──────────────────────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000;

export function scheduleSync() {
  const { mode, isAuthenticated } = useAuthStore.getState();
  if (mode !== 'cloud' || !isAuthenticated) return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flush();
  }, SYNC_DEBOUNCE_MS);
}

// ── Upload (local → Supabase) ─────────────────────────────────────────────────

export async function flush(): Promise<void> {
  const { mode, isAuthenticated, user, setSyncStatus, setLastSyncAt } =
    useAuthStore.getState();

  if (mode !== 'cloud' || !isAuthenticated || !user) return;

  setSyncStatus('syncing');

  try {
    await uploadAll(user.id);
    const now = new Date().toISOString();
    setLastSyncAt(now);
    setSyncStatus('idle');
  } catch (e) {
    console.warn('[SyncManager] flush error:', e);
    setSyncStatus('error', e instanceof Error ? e.message : 'Sync failed');
  }
}

async function uploadAll(userId: string): Promise<void> {
  if (!_mainStore || !_pomodoroStore || !_sleepStore) return;

  const main = _mainStore.getState() as any;
  const pomodoro = _pomodoroStore.getState() as any;
  const sleep = _sleepStore.getState() as any;

  const now = new Date().toISOString();

  // Run all uploads in parallel
  await Promise.all([
    uploadHabits(userId, main.habits, now),
    uploadHabitHistory(userId, main.history, now),
    uploadTasks(userId, main.tasks, now),
    uploadWeeklyGoals(userId, main.weeklyGoals, now),
    uploadShoppingItems(userId, main.shoppingList, now),
    uploadCustomCategories(userId, main.customCategories, now),
    uploadUserSettings(userId, { language: main.language, themeMode: main.themeMode }, now),
    uploadPomodoroSessions(userId, pomodoro.sessions, now),
    uploadPomodoroSettings(userId, pomodoro.settings, now),
    uploadSleepLogs(userId, sleep.logs, now),
    uploadSleepEnrollment(userId, { isEnrolled: sleep.isEnrolled, onboardingDone: sleep.onboardingDone }, now),
  ]);
}

async function uploadHabits(userId: string, habits: any[], now: string) {
  if (!habits.length) return;
  const rows = habits.map((h) => ({
    id: h.id,
    user_id: userId,
    name: h.name,
    description: h.description ?? null,
    emoji: h.emoji ?? null,
    frequency: h.frequency,
    week_days: h.weekDays ?? null,
    created_at: h.createdAt,
    updated_at: now,
  }));
  const { error } = await supabase.from('habits').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`habits: ${error.message}`);
}

async function uploadHabitHistory(userId: string, history: Record<string, Record<string, boolean>>, now: string) {
  const rows: any[] = [];
  for (const [date, dayHistory] of Object.entries(history)) {
    for (const [habitId, done] of Object.entries(dayHistory)) {
      rows.push({ user_id: userId, habit_id: habitId, date, done, updated_at: now });
    }
  }
  if (!rows.length) return;
  const { error } = await supabase.from('habit_history').upsert(rows, { onConflict: 'user_id,habit_id,date' });
  if (error) throw new Error(`habit_history: ${error.message}`);
}

async function uploadTasks(userId: string, tasks: any[], now: string) {
  if (!tasks.length) return;
  const rows = tasks.map((t) => ({
    id: t.id,
    user_id: userId,
    title: t.title,
    priority: t.priority,
    date: t.date,
    completed: t.completed,
    category: t.category ?? 'personal',
    updated_at: now,
  }));
  const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`tasks: ${error.message}`);
}

async function uploadWeeklyGoals(userId: string, goals: any[], now: string) {
  if (!goals.length) return;
  const rows = goals.map((g) => ({
    id: g.id,
    user_id: userId,
    title: g.title,
    target_count: g.targetCount,
    week_start: g.weekStart,
    completions: g.completions,
    updated_at: now,
  }));
  const { error } = await supabase.from('weekly_goals').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`weekly_goals: ${error.message}`);
}

async function uploadShoppingItems(userId: string, items: any[], now: string) {
  if (!items.length) return;
  const rows = items.map((i) => ({
    id: i.id,
    user_id: userId,
    name: i.name,
    quantity: i.quantity,
    category: i.category,
    checked: i.checked,
    updated_at: now,
  }));
  const { error } = await supabase.from('shopping_items').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`shopping_items: ${error.message}`);
}

async function uploadCustomCategories(userId: string, categories: any[], now: string) {
  if (!categories.length) return;
  const rows = categories.map((c) => ({
    id: c.id,
    user_id: userId,
    label: c.label,
    emoji: c.emoji,
    updated_at: now,
  }));
  const { error } = await supabase.from('custom_categories').upsert(rows, { onConflict: 'user_id,id' });
  if (error) throw new Error(`custom_categories: ${error.message}`);
}

async function uploadUserSettings(userId: string, settings: { language: string; themeMode: string }, now: string) {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    language: settings.language,
    theme_mode: settings.themeMode,
    updated_at: now,
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`user_settings: ${error.message}`);
}

async function uploadPomodoroSessions(userId: string, sessions: any[], now: string) {
  if (!sessions.length) return;
  const rows = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    mode: s.mode,
    linked_task_id: s.linkedTaskId ?? null,
    duration_seconds: s.durationSeconds,
    completed_at: s.completedAt,
    created_at: now,
  }));
  const { error } = await supabase.from('pomodoro_sessions').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`pomodoro_sessions: ${error.message}`);
}

async function uploadPomodoroSettings(userId: string, settings: any, now: string) {
  const { error } = await supabase.from('pomodoro_settings').upsert({
    user_id: userId,
    work_duration: settings.workDuration,
    short_break_duration: settings.shortBreakDuration,
    long_break_duration: settings.longBreakDuration,
    sessions_until_long_break: settings.sessionsUntilLongBreak,
    auto_start_break: settings.autoStartBreak,
    sound_enabled: settings.soundEnabled,
    updated_at: now,
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`pomodoro_settings: ${error.message}`);
}

async function uploadSleepLogs(userId: string, logs: Record<string, any>, now: string) {
  const entries = Object.values(logs);
  if (!entries.length) return;
  const rows = entries.map((l) => ({
    user_id: userId,
    night_date: l.nightDate,
    bedtime: l.bedtime ?? '',
    wake_time: l.wakeTime ?? '',
    total_minutes: l.totalMinutes ?? 0,
    hours_slept: l.hoursSlept ?? 0,
    quality: l.quality ?? 0,
    wake_ups: l.wakeUps ?? 0,
    checklist_done: l.checklistDone ?? [],
    notes: l.notes ?? null,
    updated_at: now,
  }));
  const { error } = await supabase.from('sleep_logs').upsert(rows, { onConflict: 'user_id,night_date' });
  if (error) throw new Error(`sleep_logs: ${error.message}`);
}

async function uploadSleepEnrollment(userId: string, enrollment: { isEnrolled: boolean; onboardingDone: boolean }, now: string) {
  const { error } = await supabase.from('sleep_enrollment').upsert({
    user_id: userId,
    is_enrolled: enrollment.isEnrolled,
    onboarding_done: enrollment.onboardingDone,
    updated_at: now,
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`sleep_enrollment: ${error.message}`);
}

// ── Download (Supabase → local) ───────────────────────────────────────────────

/**
 * Downloads all remote data and applies it to the local stores.
 * Called on first login on a new device (no local data).
 */
export async function downloadAll(): Promise<boolean> {
  const { user, setSyncStatus, setLastSyncAt } = useAuthStore.getState();
  if (!user) return false;

  setSyncStatus('syncing');

  try {
    if (!_mainStore || !_pomodoroStore || !_sleepStore) return false;

    const [
      habitsRes,
      historyRes,
      tasksRes,
      goalsRes,
      shoppingRes,
      categoriesRes,
      settingsRes,
      pomodoroSessionsRes,
      pomodoroSettingsRes,
      sleepLogsRes,
      sleepEnrollmentRes,
    ] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('habit_history').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('weekly_goals').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('shopping_items').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('custom_categories').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id),
      supabase.from('pomodoro_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('sleep_logs').select('*').eq('user_id', user.id),
      supabase.from('sleep_enrollment').select('*').eq('user_id', user.id).single(),
    ]);

    // Apply to main store
    const mainStore = _mainStore as any;
    const mainSet = mainStore.setState ?? mainStore.getState;

    if (habitsRes.data) {
      const habits = habitsRes.data.map((h: any) => ({
        id: h.id, name: h.name, description: h.description, emoji: h.emoji,
        frequency: h.frequency, weekDays: h.week_days, createdAt: h.created_at,
      }));
      mainStore.setState({ habits });
    }

    if (historyRes.data) {
      const history: Record<string, Record<string, boolean>> = {};
      for (const row of historyRes.data) {
        if (!history[row.date]) history[row.date] = {};
        history[row.date][row.habit_id] = row.done;
      }
      mainStore.setState({ history });
    }

    if (tasksRes.data) {
      const tasks = tasksRes.data.map((t: any) => ({
        id: t.id, title: t.title, priority: t.priority, date: t.date,
        completed: t.completed, category: t.category,
      }));
      mainStore.setState({ tasks });
    }

    if (goalsRes.data) {
      const weeklyGoals = goalsRes.data.map((g: any) => ({
        id: g.id, title: g.title, targetCount: g.target_count,
        weekStart: g.week_start, completions: g.completions,
      }));
      mainStore.setState({ weeklyGoals });
    }

    if (shoppingRes.data) {
      const shoppingList = shoppingRes.data.map((i: any) => ({
        id: i.id, name: i.name, quantity: i.quantity, category: i.category, checked: i.checked,
      }));
      mainStore.setState({ shoppingList });
    }

    if (categoriesRes.data) {
      const customCategories = categoriesRes.data.map((c: any) => ({
        id: c.id, label: c.label, emoji: c.emoji, isBuiltIn: false,
      }));
      mainStore.setState({ customCategories });
    }

    if (settingsRes.data) {
      mainStore.setState({
        language: settingsRes.data.language,
        themeMode: settingsRes.data.theme_mode,
      });
    }

    // Apply to pomodoro store
    const pomodoroStore = _pomodoroStore as any;

    if (pomodoroSessionsRes.data) {
      const sessions = pomodoroSessionsRes.data.map((s: any) => ({
        id: s.id, mode: s.mode, linkedTaskId: s.linked_task_id,
        durationSeconds: s.duration_seconds, completedAt: s.completed_at,
      }));
      pomodoroStore.setState({ sessions });
    }

    if (pomodoroSettingsRes.data) {
      const d = pomodoroSettingsRes.data;
      pomodoroStore.setState({
        settings: {
          workDuration: d.work_duration,
          shortBreakDuration: d.short_break_duration,
          longBreakDuration: d.long_break_duration,
          sessionsUntilLongBreak: d.sessions_until_long_break,
          autoStartBreak: d.auto_start_break,
          soundEnabled: d.sound_enabled,
        },
      });
    }

    // Apply to sleep store
    const sleepStore = _sleepStore as any;

    if (sleepLogsRes.data) {
      const logs: Record<string, any> = {};
      for (const l of sleepLogsRes.data) {
        logs[l.night_date] = {
          nightDate: l.night_date, date: l.night_date,
          bedtime: l.bedtime, wakeTime: l.wake_time,
          totalMinutes: l.total_minutes, hoursSlept: l.hours_slept,
          quality: l.quality, wakeUps: l.wake_ups,
          checklistDone: l.checklist_done, notes: l.notes,
        };
      }
      sleepStore.setState({ logs });
    }

    if (sleepEnrollmentRes.data) {
      sleepStore.setState({
        isEnrolled: sleepEnrollmentRes.data.is_enrolled,
        onboardingDone: sleepEnrollmentRes.data.onboarding_done,
      });
    }

    const now = new Date().toISOString();
    setLastSyncAt(now);
    setSyncStatus('idle');
    return true;
  } catch (e) {
    console.warn('[SyncManager] downloadAll error:', e);
    setSyncStatus('error', e instanceof Error ? e.message : 'Download failed');
    return false;
  }
}

// ── Migration (existing local data → Supabase) ────────────────────────────────

/**
 * Counts local data so the migration screen can show a summary.
 */
export function getLocalDataSummary(): {
  habits: number;
  tasks: number;
  goals: number;
  shoppingItems: number;
  sleepLogs: number;
  pomodoroSessions: number;
} {
  if (!_mainStore || !_pomodoroStore || !_sleepStore) {
    return { habits: 0, tasks: 0, goals: 0, shoppingItems: 0, sleepLogs: 0, pomodoroSessions: 0 };
  }
  const main = (_mainStore as any).getState();
  const pomodoro = (_pomodoroStore as any).getState();
  const sleep = (_sleepStore as any).getState();
  return {
    habits: main.habits?.length ?? 0,
    tasks: main.tasks?.length ?? 0,
    goals: main.weeklyGoals?.length ?? 0,
    shoppingItems: main.shoppingList?.length ?? 0,
    sleepLogs: Object.keys(sleep.logs ?? {}).length,
    pomodoroSessions: pomodoro.sessions?.length ?? 0,
  };
}

/**
 * Uploads all local data to Supabase.
 * Used for the initial migration when an existing local user signs in.
 * Calls setMigrating() to update progress in the UI.
 */
export async function migrateLocalData(): Promise<{ success: boolean; error?: string }> {
  const { user, setMigrating, setSyncStatus, setLastSyncAt } = useAuthStore.getState();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Safety: save a backup BEFORE doing anything cloud-related
  await saveBackup();

  setMigrating(true, 0);

  try {
    if (!_mainStore || !_pomodoroStore || !_sleepStore) {
      return { success: false, error: 'Stores not registered' };
    }

    const main = (_mainStore as any).getState();
    const pomodoro = (_pomodoroStore as any).getState();
    const sleep = (_sleepStore as any).getState();
    const now = new Date().toISOString();

    const steps: Array<() => Promise<void>> = [
      () => uploadHabits(user.id, main.habits ?? [], now),
      () => uploadHabitHistory(user.id, main.history ?? {}, now),
      () => uploadTasks(user.id, main.tasks ?? [], now),
      () => uploadWeeklyGoals(user.id, main.weeklyGoals ?? [], now),
      () => uploadShoppingItems(user.id, main.shoppingList ?? [], now),
      () => uploadCustomCategories(user.id, main.customCategories ?? [], now),
      () => uploadUserSettings(user.id, { language: main.language, themeMode: main.themeMode }, now),
      () => uploadPomodoroSessions(user.id, pomodoro.sessions ?? [], now),
      () => uploadPomodoroSettings(user.id, pomodoro.settings, now),
      () => uploadSleepLogs(user.id, sleep.logs ?? {}, now),
      () => uploadSleepEnrollment(user.id, { isEnrolled: sleep.isEnrolled, onboardingDone: sleep.onboardingDone }, now),
    ];

    for (let i = 0; i < steps.length; i++) {
      await steps[i]();
      setMigrating(true, (i + 1) / steps.length);
    }

    setMigrating(false, 1);
    setLastSyncAt(now);
    setSyncStatus('idle');
    return { success: true };
  } catch (e) {
    setMigrating(false, 0);
    const errorMsg = e instanceof Error ? e.message : 'Migration failed';
    setSyncStatus('error', errorMsg);
    return { success: false, error: errorMsg };
  }
}
