import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '../store/boardStore';
import type { Task, Column } from '../types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1', column_id: 'col1', title: 'Test', description: null,
  priority: 'medium', due_date: null, assignee_id: null, position: 0,
  created_by: 'user1', created_at: new Date().toISOString(),
  ...overrides,
});

const makeColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'col1', board_id: 'board1', title: 'To Do', position: 0, ...overrides,
});

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({ boards: [], currentBoard: null, columns: [], tasks: [], loading: false });
  });

  it('addTask and removeTask', () => {
    const store = useBoardStore.getState();
    store.addTask(makeTask({ id: 't1' }));
    store.addTask(makeTask({ id: 't2' }));
    expect(useBoardStore.getState().tasks).toHaveLength(2);
    store.removeTask('t1');
    expect(useBoardStore.getState().tasks).toHaveLength(1);
    expect(useBoardStore.getState().tasks[0].id).toBe('t2');
  });

  it('moveTask updates column_id and position', () => {
    useBoardStore.getState().addTask(makeTask({ id: 't1', column_id: 'col1', position: 0 }));
    useBoardStore.getState().moveTask('t1', 'col2', 3);
    const task = useBoardStore.getState().tasks[0];
    expect(task.column_id).toBe('col2');
    expect(task.position).toBe(3);
  });

  it('updateTask merges partial fields', () => {
    useBoardStore.getState().addTask(makeTask({ id: 't1', title: 'Old', priority: 'low' }));
    useBoardStore.getState().updateTask('t1', { title: 'New', priority: 'high' });
    const task = useBoardStore.getState().tasks[0];
    expect(task.title).toBe('New');
    expect(task.priority).toBe('high');
  });

  it('removeColumn also removes its tasks', () => {
    useBoardStore.setState({ columns: [makeColumn({ id: 'col1' })], tasks: [makeTask({ id: 't1', column_id: 'col1' }), makeTask({ id: 't2', column_id: 'col2' })] });
    useBoardStore.getState().removeColumn('col1');
    expect(useBoardStore.getState().columns).toHaveLength(0);
    expect(useBoardStore.getState().tasks).toHaveLength(1);
    expect(useBoardStore.getState().tasks[0].column_id).toBe('col2');
  });
});
