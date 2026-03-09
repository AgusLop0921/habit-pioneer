export type Language = 'es' | 'en' | 'pt';
export type Priority = 'high' | 'medium' | 'low';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type ShopCategory = 'food' | 'cleaning' | 'hygiene' | 'general';
export type ThemeMode = 'dark' | 'light';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  frequency: Frequency;
  weekDays?: number[];
  createdAt: string;
  userId?: string;
}

// TaskCategory is a string so it can hold built-in ids ('work','personal','sport')
// as well as user-created category ids.
export type TaskCategory = string;

export interface TaskCategoryDef {
  id: TaskCategory;
  label: string;
  emoji: string;
  isBuiltIn: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  date: string;
  completed: boolean;
  category: TaskCategory;
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

// ── Sleep Hygiene ──────────────────────────────────────────
export interface SleepChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'before' | 'environment' | 'behavior' | 'crisis';
  isKeyItem: boolean;
}

export interface SleepLog {
  nightDate: string;  // YYYY-MM-DD — date of the NIGHT (when you went to bed)
  bedtime: string;    // HH:mm
  wakeTime: string;   // HH:mm
  totalMinutes: number; // auto-calculated
  hoursSlept: number;   // legacy / convenience field
  quality: number;      // 0-5 star rating
  wakeUps: number;
  checklistDone: string[];
  notes?: string;
  // legacy compat
  date?: string;
}

export interface SleepState {
  isEnrolled: boolean;
  onboardingDone: boolean;
  logs: Record<string, SleepLog>;
}

// ── Pomodoro ───────────────────────────────────────────────
export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface PomodoroSession {
  id: string;
  mode: PomodoroMode;
  linkedTaskId?: string;
  durationSeconds: number;
  completedAt: string; // ISO
}

export interface PomodoroSettings {
  workDuration: number;       // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number;  // minutes
  sessionsUntilLongBreak: number;
  autoStartBreak: boolean;
  soundEnabled: boolean;
}
