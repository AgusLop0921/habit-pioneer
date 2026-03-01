// Variable must be prefixed with 'mock' so Jest allows it inside jest.mock() factory
let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${++mockUuidCounter}`),
}));

import { makeStore } from './testUtils';

beforeEach(() => {
  mockUuidCounter = 0;
  (require('expo-crypto').randomUUID as jest.Mock).mockImplementation(
    () => `uuid-${++mockUuidCounter}`
  );
});

describe('habitsSlice — addHabit', () => {
  it('adds a habit with generated id and createdAt', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });

    const habits = store.getState().habits;
    expect(habits).toHaveLength(1);
    expect(habits[0]).toMatchObject({ name: 'Run', frequency: 'daily', id: 'uuid-1' });
    expect(habits[0].createdAt).toBeDefined();
  });

  it('accumulates multiple habits', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().addHabit({ name: 'Read', frequency: 'weekly' });

    expect(store.getState().habits).toHaveLength(2);
    expect(store.getState().habits[1].id).toBe('uuid-2');
  });
});

describe('habitsSlice — editHabit', () => {
  it('updates only the targeted habit', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().addHabit({ name: 'Read', frequency: 'weekly' });
    store.getState().editHabit('uuid-1', { name: 'Sprint', description: 'Fast' });

    const habits = store.getState().habits;
    expect(habits[0]).toMatchObject({ id: 'uuid-1', name: 'Sprint', description: 'Fast' });
    expect(habits[1].name).toBe('Read'); // untouched
  });

  it('is a no-op for unknown id', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().editHabit('nonexistent', { name: 'Edited' });

    expect(store.getState().habits[0].name).toBe('Run');
  });
});

describe('habitsSlice — removeHabit', () => {
  it('removes the correct habit', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().addHabit({ name: 'Read', frequency: 'weekly' });
    store.getState().removeHabit('uuid-1');

    const habits = store.getState().habits;
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe('uuid-2');
  });

  it('leaves list empty when removing last habit', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().removeHabit('uuid-1');

    expect(store.getState().habits).toHaveLength(0);
  });
});

describe('habitsSlice — toggleHabitForDate', () => {
  it('marks a habit as done for a given date', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');

    expect(store.getState().history['2024-01-15']['uuid-1']).toBe(true);
  });

  it('toggles back to undone on second call', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');

    expect(store.getState().history['2024-01-15']['uuid-1']).toBe(false);
  });

  it('preserves other dates when toggling', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-14');
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');

    expect(store.getState().history['2024-01-14']['uuid-1']).toBe(true);
    expect(store.getState().history['2024-01-15']['uuid-1']).toBe(true);
  });

  it('preserves other habits in the same date entry', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().addHabit({ name: 'Read', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');
    store.getState().toggleHabitForDate('uuid-2', '2024-01-15');

    const day = store.getState().history['2024-01-15'];
    expect(day['uuid-1']).toBe(true);
    expect(day['uuid-2']).toBe(true);
  });
});

describe('habitsSlice — isHabitDoneOnDate', () => {
  it('returns false when habit has not been toggled', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });

    expect(store.getState().isHabitDoneOnDate('uuid-1', '2024-01-15')).toBe(false);
  });

  it('returns true after toggling on', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');

    expect(store.getState().isHabitDoneOnDate('uuid-1', '2024-01-15')).toBe(true);
  });

  it('returns false after toggling twice (back off)', () => {
    const store = makeStore();
    store.getState().addHabit({ name: 'Run', frequency: 'daily' });
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');
    store.getState().toggleHabitForDate('uuid-1', '2024-01-15');

    expect(store.getState().isHabitDoneOnDate('uuid-1', '2024-01-15')).toBe(false);
  });
});
