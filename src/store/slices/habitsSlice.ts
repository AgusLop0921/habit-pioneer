import type { StateCreator } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Store, HabitsSlice } from '../types';

export const createHabitsSlice: StateCreator<Store, [], [], HabitsSlice> = (set, get) => ({
  habits: [],
  history: {},

  addHabit: (habit) =>
    set((s) => ({
      habits: [
        ...s.habits,
        { ...habit, id: Crypto.randomUUID(), createdAt: new Date().toISOString() },
      ],
    })),

  editHabit: (id, updates) =>
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),

  removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

  toggleHabitForDate: (id, date) =>
    set((s) => {
      const day = s.history[date] ?? {};
      return { history: { ...s.history, [date]: { ...day, [id]: !day[id] } } };
    }),

  isHabitDoneOnDate: (id, date) => get().history[date]?.[id] ?? false,
});
