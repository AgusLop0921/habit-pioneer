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

export interface DayRecord {
  habits: Record<string, boolean>;
  tasks: Record<string, boolean>;
}

export interface AppState {
  habits: Habit[];
  tasks: Task[];
  weeklyGoals: WeeklyGoal[];
  shoppingList: ShoppingItem[];
  history: Record<string, DayRecord>;
  language: Language;
  themeMode: ThemeMode;
}
