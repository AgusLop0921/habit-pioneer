import type { StateCreator } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Store, TasksSlice } from '../types';

export const createTasksSlice: StateCreator<Store, [], [], TasksSlice> = (set) => ({
  tasks: [],

  addTask: (task) =>
    set((s) => ({
      tasks: [...s.tasks, { ...task, id: Crypto.randomUUID(), completed: false }],
    })),

  editTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    })),
});
