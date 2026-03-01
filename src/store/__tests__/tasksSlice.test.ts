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

describe('tasksSlice — addTask', () => {
  it('adds a task with generated id and completed=false', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Buy milk', priority: 'medium', date: '2024-01-15' });

    const tasks = store.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 'uuid-1',
      title: 'Buy milk',
      priority: 'medium',
      date: '2024-01-15',
      completed: false,
    });
  });

  it('accumulates multiple tasks', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Task A', priority: 'high', date: '2024-01-15' });
    store.getState().addTask({ title: 'Task B', priority: 'low', date: '2024-01-16' });

    expect(store.getState().tasks).toHaveLength(2);
    expect(store.getState().tasks[1].title).toBe('Task B');
  });
});

describe('tasksSlice — editTask', () => {
  it('updates only the targeted task', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Old title', priority: 'low', date: '2024-01-15' });
    store.getState().addTask({ title: 'Another', priority: 'high', date: '2024-01-15' });
    store.getState().editTask('uuid-1', { title: 'New title', priority: 'high' });

    const tasks = store.getState().tasks;
    expect(tasks[0]).toMatchObject({ id: 'uuid-1', title: 'New title', priority: 'high' });
    expect(tasks[1].title).toBe('Another'); // untouched
  });
});

describe('tasksSlice — removeTask', () => {
  it('removes the correct task', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Task A', priority: 'high', date: '2024-01-15' });
    store.getState().addTask({ title: 'Task B', priority: 'low', date: '2024-01-15' });
    store.getState().removeTask('uuid-1');

    const tasks = store.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('uuid-2');
  });
});

describe('tasksSlice — toggleTask', () => {
  it('marks an incomplete task as completed', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Task A', priority: 'medium', date: '2024-01-15' });
    store.getState().toggleTask('uuid-1');

    expect(store.getState().tasks[0].completed).toBe(true);
  });

  it('toggles a completed task back to incomplete', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Task A', priority: 'medium', date: '2024-01-15' });
    store.getState().toggleTask('uuid-1');
    store.getState().toggleTask('uuid-1');

    expect(store.getState().tasks[0].completed).toBe(false);
  });

  it('only toggles the targeted task', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Task A', priority: 'medium', date: '2024-01-15' });
    store.getState().addTask({ title: 'Task B', priority: 'high', date: '2024-01-15' });
    store.getState().toggleTask('uuid-1');

    expect(store.getState().tasks[0].completed).toBe(true);
    expect(store.getState().tasks[1].completed).toBe(false);
  });
});

describe('tasksSlice — filtering by date (external)', () => {
  it('can be filtered by date after addTask', () => {
    const store = makeStore();
    store.getState().addTask({ title: 'Today task', priority: 'medium', date: '2024-01-15' });
    store.getState().addTask({ title: 'Tomorrow task', priority: 'low', date: '2024-01-16' });

    const forToday = store.getState().tasks.filter((t) => t.date === '2024-01-15');
    expect(forToday).toHaveLength(1);
    expect(forToday[0].title).toBe('Today task');
  });
});
