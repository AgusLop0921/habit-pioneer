import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Store } from './types';
import {
  createHabitsSlice,
  createTasksSlice,
  createGoalsSlice,
  createShoppingSlice,
  createSettingsSlice,
  createStatsSlice,
  createCategoriesSlice,
} from './slices';

export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createHabitsSlice(...a),
      ...createTasksSlice(...a),
      ...createGoalsSlice(...a),
      ...createShoppingSlice(...a),
      ...createSettingsSlice(...a),
      ...createStatsSlice(...a),
      ...createCategoriesSlice(...a),
    }),
    {
      name: 'habits-pioneer-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export type { Store as StoreState } from './types';
export type { Store } from './types';
