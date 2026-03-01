/**
 * Creates a bare (non-persisted) Zustand store combining all slices.
 * Used in unit tests to avoid AsyncStorage / native module setup.
 */
import { create } from 'zustand';
import type { Store } from '@/store/types';
import { createHabitsSlice } from '@/store/slices/habitsSlice';
import { createTasksSlice } from '@/store/slices/tasksSlice';
import { createGoalsSlice } from '@/store/slices/goalsSlice';
import { createShoppingSlice } from '@/store/slices/shoppingSlice';
import { createSettingsSlice } from '@/store/slices/settingsSlice';
import { createStatsSlice } from '@/store/slices/statsSlice';

export function makeStore() {
  return create<Store>()((...a) => ({
    ...createHabitsSlice(...a),
    ...createTasksSlice(...a),
    ...createGoalsSlice(...a),
    ...createShoppingSlice(...a),
    ...createSettingsSlice(...a),
    ...createStatsSlice(...a),
  }));
}
