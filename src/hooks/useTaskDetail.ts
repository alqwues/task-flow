import { useCallback } from 'react';
import { App } from 'antd';
import { tasksService } from '../services/tasks';
import { activityLogService } from '../services/activityLog';
import { useTaskStore } from '../store/taskStore';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import type { Task } from '../types';

export function useTaskDetail() {
  const { message } = App.useApp();
  const { activeTask, comments, commentsLoading, setActiveTask, updateActiveTask, setComments, addComment, removeComment, setCommentsLoading } =
    useTaskStore();
  const { updateTask, currentBoard } = useBoardStore();
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
    [setActiveTask, setComments, setCommentsLoading, message]
  );

  const closeTask = useCallback(() => setActiveTask(null), [setActiveTask]);

  const saveTask = useCallback(
    async (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id'>>) => {
      try {
        await tasksService.updateTask(taskId, updates);
        updateTask(taskId, updates);
        updateActiveTask(updates);
        message.success('Task updated');
        if (currentBoard && user) {
          activityLogService.log(currentBoard.id, user.id, 'task_updated', {
            task_title: updates.title ?? activeTask?.title ?? undefined,
          }).catch(() => {});
        }
      } catch {
        message.error('Failed to update task');
      }
    },
    [updateTask, updateActiveTask, message, currentBoard, user, activeTask]
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
    [user, activeTask, addComment, message]
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
    [removeComment, message]
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
