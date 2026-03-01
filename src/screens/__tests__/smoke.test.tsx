/**
 * Screen smoke tests — verify each screen renders without crashing after
 * all external dependencies are mocked.
 */

// ── Mocks (hoisted before any imports) ──────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es', changeLanguage: jest.fn() },
  }),
}));

// Must mock before any component import resolves it
jest.mock('@/hooks/useDateLocale', () => ({
  useDateLocale: () => require('date-fns/locale/en-US').enUS,
}));

const mockTheme = {
  mode: 'dark',
  bg: '#000',
  surface: '#1c1c1e',
  surface2: '#2c2c2e',
  surface3: '#3a3a3c',
  border: '#38383a',
  borderDim: '#2c2c2e',
  accent: '#7c5cfc',
  accentLight: '#9b7dff',
  accentDim: 'rgba(124,92,252,0.15)',
  accentGlow: 'rgba(124,92,252,0.3)',
  orange: '#f97316',
  orangeDim: 'rgba(249,115,22,0.12)',
  text: '#fff',
  textSecondary: '#8e8e93',
  textMuted: '#48484a',
  textInverse: '#000',
  green: '#30d158',
  red: '#ff453a',
  yellow: '#ffd60a',
  blue: '#0a84ff',
  overlay: 'rgba(0,0,0,0.75)',
  swipeDelete: '#ff453a',
  swipeEdit: '#0a84ff',
  ringBg: '#1c1c1e',
  ringStroke: '#7c5cfc',
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme, toggleTheme: jest.fn(), themeMode: 'dark' }),
}));

jest.mock('@/hooks', () => ({
  useHabits: () => ({
    habits: [],
    dailyHabits: [],
    weeklyHabits: [],
    monthlyHabits: [],
    isHabitDone: () => false,
    completedDates: [],
    addHabit: jest.fn(),
    editHabit: jest.fn(),
    removeHabit: jest.fn(),
    toggleHabit: jest.fn(),
  }),
  useTasks: () => ({
    tasks: [],
    doneCount: 0,
    totalCount: 0,
    addTask: jest.fn(),
    editTask: jest.fn(),
    removeTask: jest.fn(),
    toggleTask: jest.fn(),
  }),
  useProgress: () => ({ habits: 0, tasks: 0, total: 0 }),
  useGoals: () => ({
    weeklyGoals: [],
    addWeeklyGoal: jest.fn(),
    editWeeklyGoal: jest.fn(),
    removeWeeklyGoal: jest.fn(),
    logGoalCompletion: jest.fn(),
  }),
  useShopping: () => ({
    shoppingList: [],
    grouped: {},
    doneCount: 0,
    totalCount: 0,
    addShoppingItem: jest.fn(),
    editShoppingItem: jest.fn(),
    removeShoppingItem: jest.fn(),
    toggleShoppingItem: jest.fn(),
  }),
  useHistory: () => ({
    habits: [],
    history: {},
    pctForDate: () => 0,
    dataForDays: (n: number) => Array.from({ length: n }, () => ({ date: '', pct: 0 })),
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
  }),
  // Sprint 4 additions
  useDateLocale: () => require('date-fns/locale/en-US').enUS,
  useHydration: () => true,
}));

// expo-haptics is already mocked by jest-expo, but make it explicit
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import TodayScreen from '@/screens/TodayScreen';
import GoalsScreen from '@/screens/GoalsScreen';
import ShoppingScreen from '@/screens/ShoppingScreen';
import HistoryScreen from '@/screens/HistoryScreen';

// ── Wrapper ──────────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Screen smoke tests', () => {
  it('TodayScreen renders without crashing', () => {
    expect(() => render(<TodayScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('GoalsScreen renders without crashing', () => {
    expect(() => render(<GoalsScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('ShoppingScreen renders without crashing', () => {
    expect(() => render(<ShoppingScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('HistoryScreen renders without crashing', () => {
    expect(() => render(<HistoryScreen />, { wrapper: Wrapper })).not.toThrow();
  });

  it('TodayScreen shows "today" label', () => {
    const { getByText } = render(<TodayScreen />, { wrapper: Wrapper });
    expect(getByText('today')).toBeTruthy();
  });

  it('GoalsScreen shows section title', () => {
    const { getByText } = render(<GoalsScreen />, { wrapper: Wrapper });
    expect(getByText('goalsSection')).toBeTruthy();
  });
});
