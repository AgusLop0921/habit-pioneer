import { subDays, format } from 'date-fns';
import { useStore } from '@/store';

const getDateStr = (d: Date) => format(d, 'yyyy-MM-dd');

/** Stats, streaks and chart data for the HistoryScreen. */
export function useHistory() {
  const habits = useStore((s) => s.habits);
  const history = useStore((s) => s.history);

  const today = new Date();
  const dailyHabits = habits.filter((h) => h.frequency === 'daily');

  /** Returns completion % (0-100) for a given date string. */
  const pctForDate = (dateStr: string): number => {
    const dayHistory = history[dateStr] ?? {};
    if (dailyHabits.length === 0) return 0;
    const done = dailyHabits.filter((h) => dayHistory[h.id]).length;
    return Math.round((done / dailyHabits.length) * 100);
  };

  /** Data points for a given day-range (e.g. last 7, 31, 182, 365 days). */
  const dataForDays = (days: number): { date: string; pct: number }[] =>
    Array.from({ length: days }, (_, i) => {
      const d = subDays(today, days - 1 - i);
      const dateStr = getDateStr(d);
      return { date: dateStr, pct: pctForDate(dateStr) };
    });

  // Total completions ever
  const totalCompleted = Object.values(history).reduce(
    (acc, day) => acc + Object.values(day).filter(Boolean).length,
    0
  );

  // Current and longest streak (consecutive days with ≥1 completion)
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < 365; i++) {
    const dateStr = getDateStr(subDays(today, i));
    const dayHistory = history[dateStr] ?? {};
    const done = Object.values(dayHistory).filter(Boolean).length;
    if (done > 0) {
      tempStreak++;
      if (i === 0 || currentStreak > 0) currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === 0) currentStreak = 0;
      tempStreak = 0;
    }
  }

  return {
    habits,
    history,
    pctForDate,
    dataForDays,
    totalCompleted,
    currentStreak,
    longestStreak,
  };
}
