import { create } from 'zustand';
import type { Board, Column, Task } from '../types';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  tasks: Task[];
  loading: boolean;

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;

  setCurrentBoard: (board: Board | null) => void;

  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (columnId: string, title: string) => void;
  removeColumn: (columnId: string) => void;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, columnId: string, position: number) => void;
  removeTask: (taskId: string) => void;

  setLoading: (loading: boolean) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  currentBoard: null,
  columns: [],
  tasks: [],
  loading: false,

  setBoards: (boards) => set({ boards }),
  addBoard: (board) => set((s) => ({ boards: [board, ...s.boards] })),
  removeBoard: (boardId) =>
    set((s) => ({ boards: s.boards.filter((b) => b.id !== boardId) })),

  setCurrentBoard: (board) => set({ currentBoard: board }),

  setColumns: (columns) => set({ columns }),
  addColumn: (column) => set((s) => ({ columns: [...s.columns, column] })),
  updateColumn: (columnId, title) =>
    set((s) => ({
      columns: s.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
    })),
  removeColumn: (columnId) =>
    set((s) => ({
      columns: s.columns.filter((c) => c.id !== columnId),
      tasks: s.tasks.filter((t) => t.column_id !== columnId),
    })),

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (taskId, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),
  moveTask: (taskId, columnId, position) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, column_id: columnId, position } : t
      ),
    })),
  removeTask: (taskId) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

  setLoading: (loading) => set({ loading }),
}));
