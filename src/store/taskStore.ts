import { create } from 'zustand';
import type { Task, Comment } from '../types';

interface TaskState {
  activeTask: Task | null;
  comments: Comment[];
  commentsLoading: boolean;

  setActiveTask: (task: Task | null) => void;
  updateActiveTask: (updates: Partial<Task>) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  removeComment: (commentId: string) => void;
  setCommentsLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  activeTask: null,
  comments: [],
  commentsLoading: false,

  setActiveTask: (task) => set({ activeTask: task, comments: [] }),
  updateActiveTask: (updates) =>
    set((s) => ({ activeTask: s.activeTask ? { ...s.activeTask, ...updates } : null })),
  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((s) => ({ comments: [...s.comments, comment] })),
  removeComment: (commentId) =>
    set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) })),
  setCommentsLoading: (loading) => set({ commentsLoading: loading }),
}));
