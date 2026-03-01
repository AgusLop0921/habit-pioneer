export type Language = 'es' | 'en' | 'pt';
export type Priority = 'high' | 'medium' | 'low';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type ShopCategory = 'food' | 'cleaning' | 'hygiene' | 'general';
export type ThemeMode = 'dark' | 'light';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: Frequency;
  weekDays?: number[];
  createdAt: string;
  userId?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  date: string;
  completed: boolean;
  userId?: string;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  targetCount: number;
  weekStart: string;
  completions: string[];
  userId?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: ShopCategory;
  checked: boolean;
  userId?: string;
}

export type DayHistory = Record<string, boolean>;

export type RootTabParamList = {
  Today: undefined;
  History: undefined;
  Goals: undefined;
  Shopping: undefined;
};
