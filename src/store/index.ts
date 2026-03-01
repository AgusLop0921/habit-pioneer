import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Habit, Task, WeeklyGoal, ShoppingItem, Language, ThemeMode, Priority, Frequency, ShopCategory } from '../types';

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
  toggleHabitToday: (id: string) => void;
  isHabitDoneToday: (id: string) => boolean;

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
  getTodayProgress: () => { habits: number; tasks: number; total: number };
}

const today = () => format(new Date(), 'yyyy-MM-dd');
const uuid = () => Math.random().toString(36).substring(2, 10);

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
          habits: [...s.habits, { ...habit, id: uuid(), createdAt: new Date().toISOString() }],
        })),
      editHabit: (id, updates) =>
        set((s) => ({ habits: s.habits.map((h) => h.id === id ? { ...h, ...updates } : h) })),
      removeHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      toggleHabitToday: (id) => {
        const date = today();
        set((s) => {
          const day = s.history[date] ?? {};
          return { history: { ...s.history, [date]: { ...day, [id]: !day[id] } } };
        });
      },
      isHabitDoneToday: (id) => get().history[today()]?.[id] ?? false,

      // ── TASKS ──
      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, { ...task, id: uuid(), completed: false }] })),
      editTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) })),
      getTasksForToday: () => {
        const date = today();
        return get().tasks.filter((t) => t.date === date);
      },

      // ── WEEKLY GOALS ──
      addWeeklyGoal: (goal) => {
        const d = new Date();
        const weekStart = format(new Date(d.setDate(d.getDate() - d.getDay() + 1)), 'yyyy-MM-dd');
        set((s) => ({
          weeklyGoals: [...s.weeklyGoals, { ...goal, id: uuid(), completions: [], weekStart }],
        }));
      },
      editWeeklyGoal: (id, updates) =>
        set((s) => ({ weeklyGoals: s.weeklyGoals.map((g) => g.id === id ? { ...g, ...updates } : g) })),
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
        set((s) => ({ shoppingList: [...s.shoppingList, { ...item, id: uuid(), checked: false }] })),
      editShoppingItem: (id, updates) =>
        set((s) => ({ shoppingList: s.shoppingList.map((i) => i.id === id ? { ...i, ...updates } : i) })),
      removeShoppingItem: (id) =>
        set((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) })),
      toggleShoppingItem: (id) =>
        set((s) => ({ shoppingList: s.shoppingList.map((i) => i.id === id ? { ...i, checked: !i.checked } : i) })),

      // ── SETTINGS ──
      setLanguage: (lang) => set({ language: lang }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      // ── STATS ──
      getTodayProgress: () => {
        const state = get();
        const date = today();
        const dayHistory = state.history[date] ?? {};
        const todayTasks = state.tasks.filter((t) => t.date === date);
        const totalHabits = state.habits.filter((h) => h.frequency === 'daily').length;
        const doneHabits = Object.values(dayHistory).filter(Boolean).length;
        const doneTasks = todayTasks.filter((t) => t.completed).length;
        const total = totalHabits + todayTasks.length;
        const done = doneHabits + doneTasks;
        return {
          habits: totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0,
          tasks: todayTasks.length > 0 ? Math.round((doneTasks / todayTasks.length) * 100) : 0,
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
