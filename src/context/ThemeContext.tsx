import React, { createContext, useContext, ReactNode } from 'react';
import { useStore } from '@/store';
import { DarkTheme, LightTheme, AppTheme } from '@/theme';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DarkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeMode, setThemeMode } = useStore();
  const isDark = themeMode === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const toggleTheme = () => setThemeMode(isDark ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
