import { useCallback, useEffect, useRef } from 'react';
import { App } from 'antd';
import { boardsService } from '../services/boards';
import { tasksService } from '../services/tasks';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import type { Column, Task } from '../types';

export function useBoardData(boardId: string) {
  const { message } = App.useApp();
  const {
    columns,
    tasks,
    loading,
    setColumns,
    setTasks,
    addColumn,
    updateColumn: updateColumnInStore,
    removeColumn,
    addTask,
    updateTask,
    removeTask,
    moveTask: moveTaskInStore,
    setLoading,
  } = useBoardStore();
  const user = useAuthStore((s) => s.user);

  const columnsRef = useRef(columns);
  useEffect(() => { columnsRef.current = columns; }, [columns]);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    try {
      const cols = await boardsService.getColumns(boardId);
      setColumns(cols);
      const columnIds = cols.map((c) => c.id);
      const taskList = await tasksService.getTasks(columnIds);
      setTasks(taskList);
    } catch {
      message.error('Failed to load board data');
    } finally {
      setLoading(false);
    }
  }, [boardId, setColumns, setTasks, setLoading]);

  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ new: col }) => addColumn(col as Column)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ new: col }) => updateColumnInStore(col.id, (col as Column).title)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ old: col }) => removeColumn(col.id as string)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        ({ new: task }) => {
          if (columnsRef.current.some((c) => c.id === task.column_id)) {
            addTask(task as Task);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        ({ new: task }) => {
          if (columnsRef.current.some((c) => c.id === task.column_id)) {
            updateTask(task.id, task as Partial<Task>);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        ({ old: task }) => removeTask(task.id as string)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardId]);

  const createColumn = useCallback(
    async (title: string) => {
      try {
        const position = columns.length;
        const col = await boardsService.createColumn(boardId, title, position);
        addColumn(col);
      } catch {
        message.error('Failed to create column');
      }
    },
    [boardId, columns.length, addColumn]
  );

  const renameColumn = useCallback(
    async (columnId: string, title: string) => {
      try {
        await boardsService.updateColumn(columnId, title);
        updateColumnInStore(columnId, title);
      } catch {
        message.error('Failed to rename column');
      }
    },
    [updateColumnInStore]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      try {
        await boardsService.deleteColumn(columnId);
        removeColumn(columnId);
      } catch {
        message.error('Failed to delete column');
      }
    },
    [removeColumn]
  );

  const createTask = useCallback(
    async (columnId: string, title: string) => {
      if (!user) return;
      try {
        const task = await tasksService.createTask(columnId, title, user.id);
        addTask(task);
      } catch {
        message.error('Failed to create task');
      }
    },
    [user, addTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await tasksService.deleteTask(taskId);
        removeTask(taskId);
      } catch {
        message.error('Failed to delete task');
      }
    },
    [removeTask]
  );

  const moveTask = useCallback(
    async (taskId: string, columnId: string, position: number) => {
      moveTaskInStore(taskId, columnId, position);
      try {
        await tasksService.moveTask(taskId, columnId, position);
      } catch {
        message.error('Failed to move task');
      }
    },
    [moveTaskInStore]
  );

  return {
    columns,
    tasks,
    loading,
    fetchBoardData,
    createColumn,
    renameColumn,
    deleteColumn,
    createTask,
    deleteTask,
    moveTask,
  };
}
