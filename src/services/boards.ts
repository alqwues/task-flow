import { supabase } from './supabase';
import type { Board, Column } from '../types';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

export const boardsService = {
  async getBoards(userId: string): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async createBoard(title: string, userId: string): Promise<Board> {
    const { data: board, error } = await supabase
      .from('boards')
      .insert({ title, owner_id: userId })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('board_members').insert({
      board_id: board.id,
      user_id: userId,
      role: 'owner',
    });

    const columns = DEFAULT_COLUMNS.map((title, position) => ({
      board_id: board.id,
      title,
      position,
    }));
    await supabase.from('columns').insert(columns);

    return board;
  },

  async deleteBoard(boardId: string): Promise<void> {
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) throw error;
  },

  async getColumns(boardId: string): Promise<Column[]> {
    const { data, error } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position');

    if (error) throw error;
    return data ?? [];
  },

  async createColumn(boardId: string, title: string, position: number): Promise<Column> {
    const { data, error } = await supabase
      .from('columns')
      .insert({ board_id: boardId, title, position })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateColumn(columnId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('columns')
      .update({ title })
      .eq('id', columnId);

    if (error) throw error;
  },

  async deleteColumn(columnId: string): Promise<void> {
    const { error } = await supabase.from('columns').delete().eq('id', columnId);
    if (error) throw error;
  },

  async getMembers(boardId: string) {
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const userIds = data.map((m) => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    return data.map((m) => ({ ...m, profile: profileMap[m.user_id] ?? null }));
  },

  async inviteMember(boardId: string, email: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error('User with this email not found');

    const { error } = await supabase.from('board_members').insert({
      board_id: boardId,
      user_id: profile.id,
      role: 'member',
    });

    if (error) throw error;
  },

  async removeMember(memberId: string) {
    const { error } = await supabase.from('board_members').delete().eq('id', memberId);
    if (error) throw error;
  },
};
