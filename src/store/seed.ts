/**
 * Llamá seedStore(store) una sola vez en desarrollo
 * para poblar la app con datos de ejemplo.
 *
 * Ejemplo de uso en App.tsx (solo en __DEV__):
 *   import { useStore } from './src/store';
 *   import { seedStore } from './src/store/seed';
 *   const store = useStore.getState();
 *   if (__DEV__ && store.habits.length === 0) seedStore(store);
 */
import { format } from 'date-fns';
import type { StoreState } from '@/store';

export function seedStore(
  store: Pick<StoreState, 'addHabit' | 'addTask' | 'addWeeklyGoal' | 'addShoppingItem'>
) {
  const today = format(new Date(), 'yyyy-MM-dd');

  store.addHabit({
    name: 'Leer 10 páginas',
    description: 'En un momento tranquilo',
    frequency: 'daily',
  });
  store.addHabit({ name: 'Hacer la cama', description: 'Apenas me levanto', frequency: 'daily' });
  store.addHabit({ name: 'Salir a correr', description: '', frequency: 'daily' });
  store.addHabit({ name: 'Lavar platos después de comer', description: '', frequency: 'daily' });
  store.addHabit({ name: 'Ir al gimnasio 3x semana', description: '', frequency: 'weekly' });

  store.addTask({ title: 'Hacer la cama', priority: 'medium', date: today });
  store.addTask({ title: 'Revisar emails', priority: 'high', date: today });

  store.addWeeklyGoal({ title: 'Ir al gimnasio', targetCount: 3 });
  store.addWeeklyGoal({ title: 'Meditar', targetCount: 5 });

  store.addShoppingItem({ name: 'Leche', quantity: 2, category: 'food' });
  store.addShoppingItem({ name: 'Detergente', quantity: 1, category: 'cleaning' });
  store.addShoppingItem({ name: 'Jabón', quantity: 2, category: 'hygiene' });
}
