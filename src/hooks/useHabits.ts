import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useStore } from '@/store';
import type { Habit } from '@/types';

const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');

/** Habits CRUD + frequency-aware done-ness for a given date. */
export function useHabits(selectedDate: Date = new Date()) {
  const habits = useStore((s) => s.habits);
  const history = useStore((s) => s.history);
  const addHabit = useStore((s) => s.addHabit);
  const editHabit = useStore((s) => s.editHabit);
  const removeHabit = useStore((s) => s.removeHabit);
  const toggle = useStore((s) => s.toggleHabitForDate);

  const dateStr = fmtDate(selectedDate);
  const weekStart = fmtDate(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const weekEnd = fmtDate(endOfWeek(selectedDate, { weekStartsOn: 1 }));
  const monthStart = fmtDate(startOfMonth(selectedDate));
  const monthEnd = fmtDate(endOfMonth(selectedDate));

  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  const weeklyHabits = habits.filter((h) => h.frequency === 'weekly');
  const monthlyHabits = habits.filter((h) => h.frequency === 'monthly');

  /** Returns whether this habit has been completed for the current period. */
  const isHabitDone = (habit: Habit): boolean => {
    if (habit.frequency === 'daily') {
      return history[dateStr]?.[habit.id] ?? false;
    }
    if (habit.frequency === 'weekly') {
      return Object.entries(history).some(
        ([d, day]) => d >= weekStart && d <= weekEnd && !!day[habit.id]
      );
    }
    // monthly
    return Object.entries(history).some(
      ([d, day]) => d >= monthStart && d <= monthEnd && !!day[habit.id]
    );
  };

  /** Dates (yyyy-MM-dd) that have at least one habit completion — for WeekStrip dots. */
  const completedDates = Object.entries(history)
    .filter(([, day]) => Object.values(day).some(Boolean))
    .map(([date]) => date);

  const toggleHabit = (habitId: string) => toggle(habitId, dateStr);

  return {
    habits,
    dailyHabits,
    weeklyHabits,
    monthlyHabits,
    isHabitDone,
    completedDates,
    addHabit,
    editHabit,
    removeHabit,
    toggleHabit,
  };
}
