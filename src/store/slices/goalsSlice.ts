import type { StateCreator } from 'zustand';
import { format } from 'date-fns';
import * as Crypto from 'expo-crypto';
import type { Store, GoalsSlice } from '../types';

export const createGoalsSlice: StateCreator<Store, [], [], GoalsSlice> = (set) => ({
  weeklyGoals: [],

  addWeeklyGoal: (goal) => {
    const d = new Date();
    // Monday of the current week
    const weekStart = format(new Date(d.setDate(d.getDate() - d.getDay() + 1)), 'yyyy-MM-dd');
    set((s) => ({
      weeklyGoals: [
        ...s.weeklyGoals,
        { ...goal, id: Crypto.randomUUID(), completions: [], weekStart },
      ],
    }));
  },

  editWeeklyGoal: (id, updates) =>
    set((s) => ({
      weeklyGoals: s.weeklyGoals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  removeWeeklyGoal: (id) => set((s) => ({ weeklyGoals: s.weeklyGoals.filter((g) => g.id !== id) })),

  logGoalCompletion: (id) =>
    set((s) => ({
      weeklyGoals: s.weeklyGoals.map((g) =>
        g.id === id ? { ...g, completions: [...g.completions, new Date().toISOString()] } : g
      ),
    })),

  undoGoalCompletion: (id) =>
    set((s) => ({
      weeklyGoals: s.weeklyGoals.map((g) =>
        g.id === id ? { ...g, completions: g.completions.slice(0, -1) } : g
      ),
    })),
});
