import { useCallback } from 'react';
import { App } from 'antd';
import { boardsService } from '../services/boards';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';

export function useBoards() {
  const { message } = App.useApp();
  const { boards, loading, setBoards, addBoard, removeBoard, setLoading } = useBoardStore();
  const user = useAuthStore((s) => s.user);

  const fetchBoards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await boardsService.getBoards(user.id);
      setBoards(data);
    } catch {
      message.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, [user, setBoards, setLoading]);

  const createBoard = useCallback(
    async (title: string) => {
      if (!user) return;
      try {
        const board = await boardsService.createBoard(title, user.id);
        addBoard(board);
        message.success('Board created');
      } catch {
        message.error('Failed to create board');
      }
    },
    [user, addBoard]
  );

  const deleteBoard = useCallback(
    async (boardId: string) => {
      try {
        await boardsService.deleteBoard(boardId);
        removeBoard(boardId);
        message.success('Board deleted');
      } catch {
        message.error('Failed to delete board');
      }
    },
    [removeBoard]
  );

  return { boards, loading, fetchBoards, createBoard, deleteBoard };
}
