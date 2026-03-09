/**
 * Central type definitions for the Zustand store.
 * All slice interfaces live here to avoid circular imports.
 */
import type { Habit, Task, TaskCategory, WeeklyGoal, ShoppingItem, Language, ThemeMode } from '@/types';
import type { CategoriesSlice } from './slices/categoriesSlice';

// ── Slice interfaces ──────────────────────────────────────────────────────────

export interface HabitsSlice {
  habits: Habit[];
  history: Record<string, Record<string, boolean>>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  editHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  removeHabit: (id: string) => void;
  toggleHabitForDate: (id: string, date: string) => void;
  isHabitDoneOnDate: (id: string, date: string) => boolean;
}

export interface TasksSlice {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'category'> & { category?: TaskCategory }) => void;
  editTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

export interface GoalsSlice {
  weeklyGoals: WeeklyGoal[];
  addWeeklyGoal: (goal: Omit<WeeklyGoal, 'id' | 'completions' | 'weekStart'>) => void;
  editWeeklyGoal: (id: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => void;
  removeWeeklyGoal: (id: string) => void;
  logGoalCompletion: (id: string) => void;
  undoGoalCompletion: (id: string) => void;
}

export interface ShoppingSlice {
  shoppingList: ShoppingItem[];
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  editShoppingItem: (id: string, updates: Partial<Omit<ShoppingItem, 'id'>>) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
}

export interface SettingsSlice {
  language: Language;
  themeMode: ThemeMode;
  setLanguage: (lang: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export interface StatsSlice {
  getProgressForDate: (date: string) => { habits: number; tasks: number; total: number };
}

// ── Full combined store type ──────────────────────────────────────────────────
export type Store = HabitsSlice &
  TasksSlice &
  GoalsSlice &
  ShoppingSlice &
  SettingsSlice &
  StatsSlice &
  CategoriesSlice;
