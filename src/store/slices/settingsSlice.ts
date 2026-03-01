import type { StateCreator } from 'zustand';
import type { Store, SettingsSlice } from '../types';

export const createSettingsSlice: StateCreator<Store, [], [], SettingsSlice> = (set) => ({
  language: 'es',
  themeMode: 'dark',

  setLanguage: (lang) => set({ language: lang }),
  setThemeMode: (mode) => set({ themeMode: mode }),
});
