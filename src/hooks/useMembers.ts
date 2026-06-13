import { useState, useCallback } from 'react';
import { App } from 'antd';
import { boardsService } from '../services/boards';
import type { BoardMember } from '../types';

export function useMembers(boardId: string) {
  const { message } = App.useApp();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardsService.getMembers(boardId);
      setMembers(data as BoardMember[]);
    } catch {
      message.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const inviteMember = useCallback(
    async (email: string) => {
      try {
        await boardsService.inviteMember(boardId, email);
        await fetchMembers();
        message.success('Member invited');
      } catch (err: any) {
        message.error(err.message ?? 'Failed to invite member');
      }
    },
    [boardId, fetchMembers]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      try {
        await boardsService.removeMember(memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        message.success('Member removed');
      } catch {
        message.error('Failed to remove member');
      }
    },
    []
  );

  return { members, loading, fetchMembers, inviteMember, removeMember };
}
