import { format } from 'date-fns';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useStore } from '@/store';
import type { Habit } from '@/types';

/** Progress percentages for habits and tasks on a given date. */
export function useProgress(selectedDate: Date = new Date()) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const history = useStore((s) => s.history);

  const isHabitDone = (habit: Habit): boolean => {
    if (habit.frequency === 'daily') return history[dateStr]?.[habit.id] ?? false;
    if (habit.frequency === 'weekly')
      return Object.entries(history).some(
        ([d, day]) => d >= weekStart && d <= weekEnd && !!day[habit.id]
      );
    return Object.entries(history).some(
      ([d, day]) => d >= monthStart && d <= monthEnd && !!day[habit.id]
    );
  };

  const tasksForDate = tasks.filter((t) => t.date === dateStr);
  const doneHabits = habits.filter(isHabitDone).length;
  const doneTasks = tasksForDate.filter((t) => t.completed).length;

  const habitsPct = habits.length > 0 ? Math.round((doneHabits / habits.length) * 100) : 0;
  const tasksPct =
    tasksForDate.length > 0 ? Math.round((doneTasks / tasksForDate.length) * 100) : 0;

  const total = habits.length + tasksForDate.length;
  const done = doneHabits + doneTasks;
  const totalPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return { habits: habitsPct, tasks: tasksPct, total: totalPct };
}
