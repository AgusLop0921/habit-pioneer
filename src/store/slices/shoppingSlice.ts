import type { StateCreator } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Store, ShoppingSlice } from '../types';

export const createShoppingSlice: StateCreator<Store, [], [], ShoppingSlice> = (set) => ({
  shoppingList: [],

  addShoppingItem: (item) =>
    set((s) => ({
      shoppingList: [...s.shoppingList, { ...item, id: Crypto.randomUUID(), checked: false }],
    })),

  editShoppingItem: (id, updates) =>
    set((s) => ({
      shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  removeShoppingItem: (id) =>
    set((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) })),

  toggleShoppingItem: (id) =>
    set((s) => ({
      shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    })),
});
