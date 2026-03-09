import { useStore } from '@/store';

/** Weekly goals CRUD + log completion. */
export function useGoals() {
  const weeklyGoals = useStore((s) => s.weeklyGoals);
  const addWeeklyGoal = useStore((s) => s.addWeeklyGoal);
  const editWeeklyGoal = useStore((s) => s.editWeeklyGoal);
  const removeWeeklyGoal = useStore((s) => s.removeWeeklyGoal);
  const logGoalCompletion = useStore((s) => s.logGoalCompletion);
  const undoGoalCompletion = useStore((s) => s.undoGoalCompletion);

  return {
    weeklyGoals,
    addWeeklyGoal,
    editWeeklyGoal,
    removeWeeklyGoal,
    logGoalCompletion,
    undoGoalCompletion,
  };
}
