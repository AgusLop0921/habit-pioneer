import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SleepLog } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const dateStr = (d: Date) => d.toISOString().split('T')[0];

const subDaysDate = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Calculate total minutes between bedtime (on nightDate) and wakeTime (next day if earlier) */
function calcTotalMinutes(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  // If wake time is earlier or same as bed time → woke up next day
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return wakeMin - bedMin;
}

// ── Store types ───────────────────────────────────────────────────────────────

interface SleepStore {
  isEnrolled: boolean;
  onboardingDone: boolean;
  /** Keyed by nightDate (YYYY-MM-DD) */
  logs: Record<string, SleepLog>;

  enroll: () => void;
  completeOnboarding: () => void;

  saveLog: (nightDate: string, partial: Partial<Omit<SleepLog, 'nightDate' | 'totalMinutes'>>) => void;
  getLog: (nightDate: string) => SleepLog | null;

  // Night-of helpers
  getLastNightLog: () => SleepLog | null;
  getTonightLog: () => SleepLog | null;
  getLogsForRange: (days: number) => SleepLog[];

  getWeekAvg: (weeksAgo?: number) => {
    hours: number;
    quality: number;
    wakeUps: number;
    compliance: number;
  };
  getMonthAvg: () => { hours: number; quality: number; compliance: number };
}

// ── Empty log factory ─────────────────────────────────────────────────────────

const emptyLog = (nightDate: string): SleepLog => ({
  nightDate,
  date: nightDate, // legacy compat
  checklistDone: [],
  hoursSlept: 0,
  totalMinutes: 0,
  quality: 0,
  wakeUps: 0,
  bedtime: '',
  wakeTime: '',
});

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSleepStore = create<SleepStore>()(
  persist(
    (set, get) => ({
      isEnrolled: false,
      onboardingDone: false,
      logs: {},

      enroll: () => set({ isEnrolled: true }),
      completeOnboarding: () => set({ onboardingDone: true }),

      saveLog: (nightDate, partial) => {
        const existing = get().logs[nightDate] ?? emptyLog(nightDate);
        const bedtime = partial.bedtime ?? existing.bedtime ?? '23:00';
        const wakeTime = partial.wakeTime ?? existing.wakeTime ?? '07:00';
        const totalMinutes = bedtime && wakeTime ? calcTotalMinutes(bedtime, wakeTime) : 0;
        const hoursSlept = Math.round((totalMinutes / 60) * 10) / 10;

        set((s) => ({
          logs: {
            ...s.logs,
            [nightDate]: {
              ...existing,
              ...partial,
              nightDate,
              date: nightDate,
              bedtime,
              wakeTime,
              totalMinutes,
              hoursSlept,
            },
          },
        }));
      },

      getLog: (nightDate) => {
        const log = get().logs[nightDate];
        if (!log) return null;
        // Backward compat: old records may have 'date' but not 'nightDate'
        return { ...log, nightDate: log.nightDate ?? log.date ?? nightDate };
      },

      // "Last night" = the night of yesterday (you went to sleep yesterday, woke up today)
      getLastNightLog: () => {
        const lastNight = dateStr(subDaysDate(1));
        return get().logs[lastNight] ?? null;
      },

      // "Tonight" = the night of today (you'll go to sleep tonight, wake up tomorrow)
      getTonightLog: () => {
        const tonight = dateStr(new Date());
        return get().logs[tonight] ?? null;
      },

      getLogsForRange: (days) => {
        const logs = get().logs;
        return Array.from({ length: days }, (_, i) => {
          const key = dateStr(subDaysDate(days - 1 - i));
          return logs[key] ?? emptyLog(key);
        });
      },

      getWeekAvg: (weeksAgo = 0) => {
        const logs = get().logs;
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = subDaysDate(i + weeksAgo * 7);
          return logs[dateStr(d)];
        }).filter((d) => d && d.hoursSlept > 0) as SleepLog[];

        if (!days.length) return { hours: 0, quality: 0, wakeUps: 0, compliance: 0 };
        const avg = (arr: number[]) =>
          Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
        return {
          hours: avg(days.map((d) => d.hoursSlept)),
          quality: avg(days.map((d) => d.quality)),
          wakeUps: avg(days.map((d) => d.wakeUps)),
          compliance: Math.round((days.length / 7) * 100),
        };
      },

      getMonthAvg: () => {
        const logs = get().logs;
        const days = Array.from({ length: 30 }, (_, i) => {
          const d = subDaysDate(i);
          return logs[dateStr(d)];
        }).filter((d) => d && d.hoursSlept > 0) as SleepLog[];

        if (!days.length) return { hours: 0, quality: 0, compliance: 0 };
        const avg = (arr: number[]) =>
          Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
        return {
          hours: avg(days.map((d) => d.hoursSlept)),
          quality: avg(days.map((d) => d.quality)),
          compliance: Math.round((days.length / 30) * 100),
        };
      },
    }),
    {
      name: 'habits-pioneer-sleep-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Migrate old logs on rehydrate: backfill nightDate and totalMinutes
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const migratedLogs: Record<string, ReturnType<typeof emptyLog>> = {};
        let needsMigration = false;

        for (const [key, log] of Object.entries(state.logs)) {
          const hasNightDate = !!(log as any).nightDate;
          const hasTotalMinutes = (log as any).totalMinutes > 0;
          if (hasNightDate && hasTotalMinutes) {
            migratedLogs[key] = log as any;
            continue;
          }
          needsMigration = true;
          const nightDate = (log as any).nightDate ?? (log as any).date ?? key;
          const bedtime = (log as any).bedtime ?? '';
          const wakeTime = (log as any).wakeTime ?? '';
          const totalMinutes =
            bedtime && wakeTime ? calcTotalMinutes(bedtime, wakeTime) : 0;
          const hoursSlept =
            (log as any).hoursSlept > 0
              ? (log as any).hoursSlept
              : Math.round((totalMinutes / 60) * 10) / 10;
          migratedLogs[key] = {
            ...(log as any),
            nightDate,
            date: nightDate,
            totalMinutes,
            hoursSlept,
          };
        }

        if (needsMigration) {
          state.logs = migratedLogs;
        }
      },
    }
  )
);
