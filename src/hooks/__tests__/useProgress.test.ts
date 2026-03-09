/**
 * useProgress tests.
 * The hook reads habits/tasks/history from the store and computes
 * percentage progress, respecting frequency — we mock useStore to
 * supply controlled state without any native modules.
 */
jest.mock('@/store', () => ({ useStore: jest.fn() }));

import { renderHook } from '@testing-library/react-native';
import { useStore } from '@/store';
import { useProgress } from '@/hooks/useProgress';
import type { Habit, Task } from '@/types';

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setStoreMock(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseStore.mockImplementation((selector: (s: any) => unknown) => selector(state));
}

// Fixed "today" so tests don't drift: 2024-06-10 (Monday)
const TODAY = new Date(2024, 5, 10);
const TODAY_STR = '2024-06-10';

function makeHabit(overrides: Partial<Habit> & { id: string }): Habit {
  return { name: 'H', frequency: 'daily', createdAt: '2024-01-01T00:00:00.000Z', ...overrides };
}

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return { title: 'T', priority: 'medium', date: TODAY_STR, completed: false, category: 'personal', ...overrides };
}

describe('useProgress — empty store', () => {
  it('returns 0% for all fields when there are no habits or tasks', () => {
    setStoreMock({ habits: [], tasks: [], history: {} });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current).toEqual({ habits: 0, tasks: 0, total: 0 });
  });
});

describe('useProgress — daily habits', () => {
  it('returns 0% when no daily habits are done', () => {
    setStoreMock({
      habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
      tasks: [],
      history: {},
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.habits).toBe(0);
  });

  it('returns 50% when half daily habits are done', () => {
    setStoreMock({
      habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
      tasks: [],
      history: { [TODAY_STR]: { h1: true } },
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.habits).toBe(50);
  });

  it('returns 100% when all daily habits are done', () => {
    setStoreMock({
      habits: [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' })],
      tasks: [],
      history: { [TODAY_STR]: { h1: true, h2: true } },
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.habits).toBe(100);
  });
});

describe('useProgress — tasks', () => {
  it('returns 0% tasks when none are completed', () => {
    setStoreMock({
      habits: [],
      tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
      history: {},
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.tasks).toBe(0);
  });

  it('ignores tasks from other dates', () => {
    setStoreMock({
      habits: [],
      tasks: [
        makeTask({ id: 't1', date: '2024-06-09', completed: true }),
        makeTask({ id: 't2', date: TODAY_STR, completed: false }),
      ],
      history: {},
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.tasks).toBe(0); // only t2 counts, and it's not done
  });

  it('returns 100% when all date tasks are done', () => {
    setStoreMock({
      habits: [],
      tasks: [makeTask({ id: 't1', completed: true }), makeTask({ id: 't2', completed: true })],
      history: {},
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.tasks).toBe(100);
  });
});

describe('useProgress — total combined', () => {
  it('combines habits and tasks in total percentage', () => {
    setStoreMock({
      habits: [makeHabit({ id: 'h1' })], // 1 daily habit, done
      tasks: [makeTask({ id: 't1', completed: false })], // 1 task, not done
      history: { [TODAY_STR]: { h1: true } },
    });
    const { result } = renderHook(() => useProgress(TODAY));
    // 1 done out of 2 total = 50%
    expect(result.current.total).toBe(50);
  });

  it('weekly habit done in current week counts toward habits progress', () => {
    const weeklyHabit = makeHabit({ id: 'h1', frequency: 'weekly' });
    // Completed on Monday 2024-06-10 — same week as TODAY
    setStoreMock({
      habits: [weeklyHabit],
      tasks: [],
      history: { [TODAY_STR]: { h1: true } },
    });
    const { result } = renderHook(() => useProgress(TODAY));
    expect(result.current.habits).toBe(100);
  });
});
