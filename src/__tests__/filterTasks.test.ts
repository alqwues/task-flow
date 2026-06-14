import { describe, it, expect } from 'vitest';
import { filterTasks } from '../utils/filterTasks';
import type { Task } from '../types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  column_id: 'col1',
  title: 'Test task',
  description: null,
  priority: 'medium',
  due_date: null,
  assignee_id: null,
  position: 0,
  created_by: 'user1',
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('filterTasks', () => {
  it('returns all tasks when no filters applied', () => {
    const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' })];
    expect(filterTasks(tasks, '', '', '', false)).toHaveLength(2);
  });

  it('filters by search text (case insensitive)', () => {
    const tasks = [makeTask({ title: 'Fix bug' }), makeTask({ title: 'Write docs' })];
    expect(filterTasks(tasks, 'FIX', '', '', false)).toHaveLength(1);
    expect(filterTasks(tasks, 'FIX', '', '', false)[0].title).toBe('Fix bug');
  });

  it('filters by priority', () => {
    const tasks = [makeTask({ priority: 'high' }), makeTask({ priority: 'low' }), makeTask({ priority: 'medium' })];
    expect(filterTasks(tasks, '', 'high', '', false)).toHaveLength(1);
    expect(filterTasks(tasks, '', 'low', '', false)[0].priority).toBe('low');
  });

  it('filters by assignee', () => {
    const tasks = [makeTask({ assignee_id: 'user1' }), makeTask({ assignee_id: 'user2' }), makeTask()];
    expect(filterTasks(tasks, '', '', 'user1', false)).toHaveLength(1);
    expect(filterTasks(tasks, '', '', '', false)).toHaveLength(3);
  });

  it('filters overdue tasks only', () => {
    const past = '2020-01-01';
    const future = '2099-01-01';
    const tasks = [makeTask({ due_date: past }), makeTask({ due_date: future }), makeTask()];
    const overdue = filterTasks(tasks, '', '', '', true);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].due_date).toBe(past);
  });

  it('combines multiple filters', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Fix bug', priority: 'high', assignee_id: 'user1' }),
      makeTask({ id: '2', title: 'Fix docs', priority: 'low', assignee_id: 'user1' }),
      makeTask({ id: '3', title: 'Write tests', priority: 'high', assignee_id: 'user2' }),
    ];
    expect(filterTasks(tasks, 'fix', 'high', 'user1', false)).toHaveLength(1);
    expect(filterTasks(tasks, 'fix', 'high', 'user1', false)[0].id).toBe('1');
  });
});
