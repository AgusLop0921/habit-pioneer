import { format } from 'date-fns';
import { useStore } from '@/store';

/** Tasks CRUD filtered to a specific date (defaults to today). */
export function useTasks(selectedDate: Date = new Date()) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const editTask = useStore((s) => s.editTask);
  const removeTask = useStore((s) => s.removeTask);
  const toggleTask = useStore((s) => s.toggleTask);

  const tasksForDate = tasks.filter((t) => t.date === dateStr);
  const doneCount = tasksForDate.filter((t) => t.completed).length;
  const totalCount = tasksForDate.length;

  const addTaskForDate = (
    title: string,
    priority: import('@/types').Priority,
    extra?: Partial<Omit<import('@/types').Task, 'id' | 'completed'>>
  ) => addTask({ title, priority, date: dateStr, ...extra } as any);

  return {
    tasks: tasksForDate,
    doneCount,
    totalCount,
    addTask: addTaskForDate,
    editTask,
    removeTask,
    toggleTask,
  };
}
