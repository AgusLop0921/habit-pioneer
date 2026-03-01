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

describe('goalsSlice — addWeeklyGoal', () => {
  it('adds a goal with generated id, empty completions, and weekStart', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise 3x', targetCount: 3 });

    const goals = store.getState().weeklyGoals;
    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({ id: 'uuid-1', title: 'Exercise 3x', targetCount: 3 });
    expect(goals[0].completions).toHaveLength(0);
    expect(goals[0].weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('accumulates multiple goals', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().addWeeklyGoal({ title: 'Read', targetCount: 5 });

    expect(store.getState().weeklyGoals).toHaveLength(2);
    expect(store.getState().weeklyGoals[1].id).toBe('uuid-2');
  });
});

describe('goalsSlice — editWeeklyGoal', () => {
  it('updates only the targeted goal', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().addWeeklyGoal({ title: 'Read', targetCount: 5 });
    store.getState().editWeeklyGoal('uuid-1', { title: 'Gym', targetCount: 4 });

    const goals = store.getState().weeklyGoals;
    expect(goals[0]).toMatchObject({ id: 'uuid-1', title: 'Gym', targetCount: 4 });
    expect(goals[1].title).toBe('Read'); // untouched
  });
});

describe('goalsSlice — removeWeeklyGoal', () => {
  it('removes the correct goal', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().addWeeklyGoal({ title: 'Read', targetCount: 5 });
    store.getState().removeWeeklyGoal('uuid-1');

    const goals = store.getState().weeklyGoals;
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe('uuid-2');
  });
});

describe('goalsSlice — logGoalCompletion', () => {
  it('appends a completion ISO string to the goal', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().logGoalCompletion('uuid-1');

    const goal = store.getState().weeklyGoals[0];
    expect(goal.completions).toHaveLength(1);
    expect(new Date(goal.completions[0]).toString()).not.toBe('Invalid Date');
  });

  it('appends multiple completions and tracks progress toward target', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().logGoalCompletion('uuid-1');
    store.getState().logGoalCompletion('uuid-1');
    store.getState().logGoalCompletion('uuid-1');

    const goal = store.getState().weeklyGoals[0];
    expect(goal.completions).toHaveLength(3);
    // completed the weekly target
    expect(goal.completions.length).toBeGreaterThanOrEqual(goal.targetCount);
  });

  it('only affects the targeted goal', () => {
    const store = makeStore();
    store.getState().addWeeklyGoal({ title: 'Exercise', targetCount: 3 });
    store.getState().addWeeklyGoal({ title: 'Read', targetCount: 5 });
    store.getState().logGoalCompletion('uuid-1');

    expect(store.getState().weeklyGoals[0].completions).toHaveLength(1);
    expect(store.getState().weeklyGoals[1].completions).toHaveLength(0);
  });
});
