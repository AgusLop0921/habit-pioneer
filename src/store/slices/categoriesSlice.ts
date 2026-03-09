import type { StateCreator } from 'zustand';
import type { Store } from '../types';
import type { TaskCategoryDef } from '@/types';

// ── Built-in categories (always present, cannot be deleted) ─────────────────
export const BUILT_IN_CATEGORIES: TaskCategoryDef[] = [
    { id: 'work', label: 'Trabajo', emoji: '💼', isBuiltIn: true },
    { id: 'personal', label: 'Personal', emoji: '🏠', isBuiltIn: true },
    { id: 'sport', label: 'Deporte', emoji: '🏃', isBuiltIn: true },
];

// ── Slice interface ─────────────────────────────────────────────────────────
export interface CategoriesSlice {
    customCategories: TaskCategoryDef[];
    addTaskCategory: (category: Omit<TaskCategoryDef, 'isBuiltIn'>) => void;
    removeTaskCategory: (id: string) => void;
    getAllCategories: () => TaskCategoryDef[];
}

// ── Slice creator ────────────────────────────────────────────────────────────
export const createCategoriesSlice: StateCreator<Store, [], [], CategoriesSlice> = (set, get) => ({
    customCategories: [],

    addTaskCategory: (category) => {
        set((s) => ({
            customCategories: [
                ...s.customCategories,
                { ...category, isBuiltIn: false },
            ],
        }));
    },

    removeTaskCategory: (id) => {
        set((s) => ({
            customCategories: s.customCategories.filter((c) => c.id !== id),
        }));
    },

    getAllCategories: () => {
        return [...BUILT_IN_CATEGORIES, ...get().customCategories];
    },
});
