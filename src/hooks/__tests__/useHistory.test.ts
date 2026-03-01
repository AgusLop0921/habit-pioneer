/**
 * useHistory tests.
 * Verifies streak calculation, pctForDate, dataForDays and totalCompleted.
 */
jest.mock('@/store', () => ({ useStore: jest.fn() }));

import { renderHook } from '@testing-library/react-native';
import { subDays, format } from 'date-fns';
import { useStore } from '@/store';
import { useHistory } from '@/hooks/useHistory';
import type { Habit } from '@/types';

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

function setStoreMock(habits: Habit[], history: Record<string, Record<string, boolean>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseStore.mockImplementation((selector: (s: any) => unknown) => selector({ habits, history }));
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
const today = new Date();

function makeHabit(id: string, frequency: Habit['frequency'] = 'daily'): Habit {
  return { id, name: 'H', frequency, createdAt: '2024-01-01T00:00:00.000Z' };
}

describe('useHistory — totalCompleted', () => {
  it('returns 0 when no completions exist', () => {
    setStoreMock([makeHabit('h1')], {});
    const { result } = renderHook(() => useHistory());
    expect(result.current.totalCompleted).toBe(0);
  });

  it('counts all true values across history', () => {
    setStoreMock([makeHabit('h1'), makeHabit('h2')], {
      '2024-01-10': { h1: true, h2: true },
      '2024-01-11': { h1: true, h2: false },
    });
    const { result } = renderHook(() => useHistory());
    expect(result.current.totalCompleted).toBe(3);
  });
});

describe('useHistory — pctForDate', () => {
  it('returns 0 for a date with no completions', () => {
    setStoreMock([makeHabit('h1'), makeHabit('h2')], {});
    const { result } = renderHook(() => useHistory());
    expect(result.current.pctForDate('2024-01-10')).toBe(0);
  });

  it('returns 50 when half daily habits are done on that date', () => {
    setStoreMock([makeHabit('h1'), makeHabit('h2')], { '2024-01-10': { h1: true, h2: false } });
    const { result } = renderHook(() => useHistory());
    expect(result.current.pctForDate('2024-01-10')).toBe(50);
  });

  it('returns 100 when all daily habits are done', () => {
    setStoreMock([makeHabit('h1'), makeHabit('h2')], { '2024-01-10': { h1: true, h2: true } });
    const { result } = renderHook(() => useHistory());
    expect(result.current.pctForDate('2024-01-10')).toBe(100);
  });

  it('ignores non-daily habits in pctForDate', () => {
    setStoreMock([makeHabit('h1', 'daily'), makeHabit('h2', 'weekly')], {
      '2024-01-10': { h1: true, h2: true },
    });
    const { result } = renderHook(() => useHistory());
    // h2 is weekly, only h1 counts → 1/1 = 100 (but h2 completion in history adds no denominator)
    expect(result.current.pctForDate('2024-01-10')).toBe(100);
  });

  it('returns 0 when there are no daily habits', () => {
    setStoreMock([makeHabit('h1', 'weekly')], { '2024-01-10': { h1: true } });
    const { result } = renderHook(() => useHistory());
    expect(result.current.pctForDate('2024-01-10')).toBe(0);
  });
});

describe('useHistory — dataForDays', () => {
  it('returns correct number of data points', () => {
    setStoreMock([makeHabit('h1')], {});
    const { result } = renderHook(() => useHistory());
    expect(result.current.dataForDays(7)).toHaveLength(7);
    expect(result.current.dataForDays(31)).toHaveLength(31);
  });

  it('last entry corresponds to today', () => {
    setStoreMock([makeHabit('h1')], {});
    const { result } = renderHook(() => useHistory());
    const data = result.current.dataForDays(7);
    expect(data[data.length - 1].date).toBe(fmt(today));
  });

  it('first entry corresponds to (n-1) days ago', () => {
    setStoreMock([makeHabit('h1')], {});
    const { result } = renderHook(() => useHistory());
    const data = result.current.dataForDays(7);
    expect(data[0].date).toBe(fmt(subDays(today, 6)));
  });
});

describe('useHistory — streaks', () => {
  it('currentStreak is 0 when no completions today', () => {
    setStoreMock([makeHabit('h1')], {});
    const { result } = renderHook(() => useHistory());
    expect(result.current.currentStreak).toBe(0);
  });

  it('currentStreak is 1 when only today has been completed', () => {
    setStoreMock([makeHabit('h1')], { [fmt(today)]: { h1: true } });
    const { result } = renderHook(() => useHistory());
    expect(result.current.currentStreak).toBe(1);
  });

  it('currentStreak counts consecutive days up to today', () => {
    const history: Record<string, Record<string, boolean>> = {};
    for (let i = 0; i < 5; i++) {
      history[fmt(subDays(today, i))] = { h1: true };
    }
    setStoreMock([makeHabit('h1')], history);
    const { result } = renderHook(() => useHistory());
    expect(result.current.currentStreak).toBe(5);
  });

  it('currentStreak breaks on a gap (missed yesterday)', () => {
    // Completed today and 2+ days ago but NOT yesterday
    const history: Record<string, Record<string, boolean>> = {
      [fmt(today)]: { h1: true },
      [fmt(subDays(today, 2))]: { h1: true },
    };
    setStoreMock([makeHabit('h1')], history);
    const { result } = renderHook(() => useHistory());
    expect(result.current.currentStreak).toBe(1); // only today
  });

  it('longestStreak is tracked independently of current streak', () => {
    // 3 days last week, then a gap, then 1 day today
    const history: Record<string, Record<string, boolean>> = {
      [fmt(today)]: { h1: true },
      [fmt(subDays(today, 10))]: { h1: true },
      [fmt(subDays(today, 11))]: { h1: true },
      [fmt(subDays(today, 12))]: { h1: true },
    };
    setStoreMock([makeHabit('h1')], history);
    const { result } = renderHook(() => useHistory());
    expect(result.current.currentStreak).toBe(1);
    expect(result.current.longestStreak).toBe(3);
  });
});
