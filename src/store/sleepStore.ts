import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepLog } from '../types';

interface SleepStore {
  isEnrolled: boolean;
  onboardingDone: boolean;
  logs: Record<string, SleepLog>;

  enroll: () => void;
  completeOnboarding: () => void;

  saveLog: (date: string, log: Partial<SleepLog>) => void;
  getLog: (date: string) => SleepLog | null;
  getLogsForRange: (days: number) => SleepLog[];
  getWeekAvg: (weeksAgo?: number) => {
    hours: number;
    quality: number;
    wakeUps: number;
    compliance: number;
  };
  getMonthAvg: () => { hours: number; quality: number; compliance: number };
}

const emptyLog = (date: string): SleepLog => ({
  date,
  checklistDone: [],
  hoursSlept: 0,
  quality: 0,
  wakeUps: 0,
  bedtime: '',
  wakeTime: '',
});

const dateStr = (d: Date) => d.toISOString().split('T')[0];
const subDaysStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
};

export const useSleepStore = create<SleepStore>()(
  persist(
    (set, get) => ({
      isEnrolled: false,
      onboardingDone: false,
      logs: {},

      enroll: () => set({ isEnrolled: false }),
      completeOnboarding: () => set({ onboardingDone: true }),

      saveLog: (date, partial) =>
        set((s) => ({
          logs: { ...s.logs, [date]: { ...emptyLog(date), ...s.logs[date], ...partial, date } },
        })),

      getLog: (date) => get().logs[date] ?? null,

      getLogsForRange: (days) => {
        const logs = get().logs;
        return Array.from({ length: days }, (_, i) => {
          const key = subDaysStr(days - 1 - i);
          return logs[key] ?? emptyLog(key);
        });
      },

      getWeekAvg: (weeksAgo = 0) => {
        const logs = get().logs;
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i - weeksAgo * 7);
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
          const d = new Date();
          d.setDate(d.getDate() - i);
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
    { name: 'habits-pioneer-sleep-v1', storage: createJSONStorage(() => AsyncStorage) }
  )
);
