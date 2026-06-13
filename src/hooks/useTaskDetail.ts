import { useCallback } from 'react';
import { App } from 'antd';
import { tasksService } from '../services/tasks';
import { useTaskStore } from '../store/taskStore';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import type { Task } from '../types';

export function useTaskDetail() {
  const { message } = App.useApp();
  const { activeTask, comments, commentsLoading, setActiveTask, updateActiveTask, setComments, addComment, removeComment, setCommentsLoading } =
    useTaskStore();
  const { updateTask } = useBoardStore();
  const user = useAuthStore((s) => s.user);

  const openTask = useCallback(
    async (task: Task) => {
      setActiveTask(task);
      setCommentsLoading(true);
      try {
        const data = await tasksService.getComments(task.id);
        setComments(data);
      } catch {
        message.error('Failed to load comments');
      } finally {
        setCommentsLoading(false);
      }
    },
    [setActiveTask, setComments, setCommentsLoading]
  );

  const closeTask = useCallback(() => setActiveTask(null), [setActiveTask]);

  const saveTask = useCallback(
    async (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id'>>) => {
      try {
        await tasksService.updateTask(taskId, updates);
        updateTask(taskId, updates);
        updateActiveTask(updates);
        message.success('Task updated');
      } catch {
        message.error('Failed to update task');
      }
    },
    [activeTask, updateTask, setActiveTask]
  );

  const postComment = useCallback(
    async (content: string) => {
      if (!user || !activeTask) return;
      try {
        const comment = await tasksService.addComment(activeTask.id, user.id, content);
        addComment(comment);
      } catch {
        message.error('Failed to add comment');
      }
    },
    [user, activeTask, addComment]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await tasksService.deleteComment(commentId);
        removeComment(commentId);
      } catch {
        message.error('Failed to delete comment');
      }
    },
    [removeComment]
  );

  return {
    activeTask,
    comments,
    commentsLoading,
    openTask,
    closeTask,
    saveTask,
    postComment,
    deleteComment,
  };
}
