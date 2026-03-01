import type { StateCreator } from 'zustand';
import type { Store, StatsSlice } from '../types';

export const createStatsSlice: StateCreator<Store, [], [], StatsSlice> = (_set, get) => ({
  getProgressForDate: (date) => {
    const { habits, tasks, history } = get();
    const dayHistory = history[date] ?? {};
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const dateTasks = tasks.filter((t) => t.date === date);
    const doneHabits = dailyHabits.filter((h) => dayHistory[h.id]).length;
    const doneTasks = dateTasks.filter((t) => t.completed).length;
    const total = dailyHabits.length + dateTasks.length;
    const done = doneHabits + doneTasks;
    return {
      habits: dailyHabits.length > 0 ? Math.round((doneHabits / dailyHabits.length) * 100) : 0,
      tasks: dateTasks.length > 0 ? Math.round((doneTasks / dateTasks.length) * 100) : 0,
      total: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  },
});
