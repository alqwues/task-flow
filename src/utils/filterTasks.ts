import type { Task, Priority } from '../types';

export function filterTasks(
  tasks: Task[],
  search: string,
  priority: Priority | '',
  assigneeId: string,
  overdueOnly: boolean
): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = !priority || t.priority === priority;
    const matchesAssignee = !assigneeId || t.assignee_id === assigneeId;
    const matchesOverdue = !overdueOnly || (!!t.due_date && t.due_date < today);
    return matchesSearch && matchesPriority && matchesAssignee && matchesOverdue;
  });
}
