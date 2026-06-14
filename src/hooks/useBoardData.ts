import { useCallback, useEffect } from 'react';
import { App } from 'antd';
import { boardsService } from '../services/boards';
import { tasksService } from '../services/tasks';
import { activityLogService } from '../services/activityLog';
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
    removeTask,
    moveTask: moveTaskInStore,
    setLoading,
  } = useBoardStore();
  const user = useAuthStore((s) => s.user);

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
  }, [boardId, setColumns, setTasks, setLoading, message]);

  // Realtime — use getState() to avoid stale closures and dedup local mutations
  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ new: col }) => {
          const store = useBoardStore.getState();
          if (!store.columns.some((c) => c.id === col.id)) store.addColumn(col as Column);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ new: col }) => useBoardStore.getState().updateColumn(col.id, (col as Column).title)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        ({ old: col }) => useBoardStore.getState().removeColumn(col.id as string)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        ({ new: task }) => {
          const store = useBoardStore.getState();
          if (
            !store.tasks.some((t) => t.id === task.id) &&
            store.columns.some((c) => c.id === task.column_id)
          ) {
            store.addTask(task as Task);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        ({ new: task }) => {
          const store = useBoardStore.getState();
          if (store.columns.some((c) => c.id === task.column_id)) {
            store.updateTask(task.id, task as Partial<Task>);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        ({ old: task }) => useBoardStore.getState().removeTask(task.id as string)
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
    [boardId, columns.length, addColumn, message]
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
    [updateColumnInStore, message]
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
    [removeColumn, message]
  );

  const createTask = useCallback(
    async (columnId: string, title: string) => {
      if (!user) return;
      try {
        const task = await tasksService.createTask(columnId, title, user.id);
        addTask(task);
        const col = useBoardStore.getState().columns.find((c) => c.id === columnId);
        activityLogService.log(boardId, user.id, 'task_created', {
          task_title: task.title,
          column: col?.title,
        }).catch(() => {});
      } catch {
        message.error('Failed to create task');
      }
    },
    [user, addTask, message, boardId]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const taskToDelete = useBoardStore.getState().tasks.find((t) => t.id === taskId);
      try {
        await tasksService.deleteTask(taskId);
        removeTask(taskId);
        if (taskToDelete && user) {
          activityLogService.log(boardId, user.id, 'task_deleted', {
            task_title: taskToDelete.title,
          }).catch(() => {});
        }
      } catch {
        message.error('Failed to delete task');
      }
    },
    [removeTask, message, boardId, user]
  );

  const moveTask = useCallback(
    async (taskId: string, columnId: string, position: number) => {
      const store = useBoardStore.getState();
      const existingTask = store.tasks.find((t) => t.id === taskId);
      const isColumnChange = existingTask && existingTask.column_id !== columnId;
      moveTaskInStore(taskId, columnId, position);
      try {
        await tasksService.moveTask(taskId, columnId, position);
        if (isColumnChange && user) {
          const col = useBoardStore.getState().columns.find((c) => c.id === columnId);
          activityLogService.log(boardId, user.id, 'task_moved', {
            task_title: existingTask.title,
            to_column: col?.title,
          }).catch(() => {});
        }
      } catch (err) {
        message.error('Failed to move task');
        throw err;
      }
    },
    [moveTaskInStore, message, boardId, user]
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
