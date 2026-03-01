import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Crypto from 'expo-crypto';
import { Habit, Task, WeeklyGoal, ShoppingItem, Language, ThemeMode } from '@/types';

interface Store {
  habits: Habit[];
  tasks: Task[];
  weeklyGoals: WeeklyGoal[];
  shoppingList: ShoppingItem[];
  history: Record<string, Record<string, boolean>>;
  language: Language;
  themeMode: ThemeMode;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  editHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  removeHabit: (id: string) => void;
  toggleHabitForDate: (id: string, date: string) => void;
  isHabitDoneOnDate: (id: string, date: string) => boolean;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  editTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getTasksForToday: () => Task[];

  // Weekly Goals
  addWeeklyGoal: (goal: Omit<WeeklyGoal, 'id' | 'completions' | 'weekStart'>) => void;
  editWeeklyGoal: (id: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => void;
  removeWeeklyGoal: (id: string) => void;
  logGoalCompletion: (id: string) => void;

  // Shopping
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  editShoppingItem: (id: string, updates: Partial<Omit<ShoppingItem, 'id'>>) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;

  // Settings
  setLanguage: (lang: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Stats
  getProgressForDate: (date: string) => { habits: number; tasks: number; total: number };
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      habits: [],
      tasks: [],
      weeklyGoals: [],
      shoppingList: [],
      history: {},
      language: 'es',
      themeMode: 'dark',

      // ── HABITS ──
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
      toggleHabitForDate: (id, date) => {
        set((s) => {
          const day = s.history[date] ?? {};
          return { history: { ...s.history, [date]: { ...day, [id]: !day[id] } } };
        });
      },
      isHabitDoneOnDate: (id, date) => get().history[date]?.[id] ?? false,

      // ── TASKS ──
      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, { ...task, id: Crypto.randomUUID(), completed: false }],
        })),
      editTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })),
      getTasksForToday: () => {
        const date = today();
        return get().tasks.filter((t) => t.date === date);
      },

      // ── WEEKLY GOALS ──
      addWeeklyGoal: (goal) => {
        const d = new Date();
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
      removeWeeklyGoal: (id) =>
        set((s) => ({ weeklyGoals: s.weeklyGoals.filter((g) => g.id !== id) })),
      logGoalCompletion: (id) =>
        set((s) => ({
          weeklyGoals: s.weeklyGoals.map((g) =>
            g.id === id ? { ...g, completions: [...g.completions, new Date().toISOString()] } : g
          ),
        })),

      // ── SHOPPING ──
      addShoppingItem: (item) =>
        set((s) => ({
          shoppingList: [...s.shoppingList, { ...item, id: Crypto.randomUUID(), checked: false }],
        })),
      editShoppingItem: (id, updates) =>
        set((s) => ({
          shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      removeShoppingItem: (id) =>
        set((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) })),
      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingList: s.shoppingList.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          ),
        })),

      // ── SETTINGS ──
      setLanguage: (lang) => set({ language: lang }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      // ── STATS ──
      getProgressForDate: (date) => {
        const state = get();
        const dayHistory = state.history[date] ?? {};
        const dateTasks = state.tasks.filter((t) => t.date === date);
        const dailyHabits = state.habits.filter((h) => h.frequency === 'daily');
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
    }),
    {
      name: 'habits-pioneer-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export type StoreState = Store;
