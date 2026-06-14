import { supabase } from './supabase';
import type { Profile } from '../types';

export type ActivityAction = 'task_created' | 'task_moved' | 'task_deleted' | 'task_updated';

export interface ActivityMeta {
  task_title?: string;
  column?: string;
  to_column?: string;
}

export interface ActivityLog {
  id: string;
  board_id: string;
  user_id: string;
  action: ActivityAction;
  meta: ActivityMeta;
  created_at: string;
  profile?: Profile | null;
}

export const activityLogService = {
  async log(boardId: string, userId: string, action: ActivityAction, meta: ActivityMeta): Promise<void> {
    await supabase.from('activity_logs').insert({ board_id: boardId, user_id: userId, action, meta });
  },

  async getLogs(boardId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((l: ActivityLog) => l.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p: Profile) => [p.id, p]));

    return data.map((l: ActivityLog) => ({ ...l, profile: profileMap[l.user_id] ?? null }));
  },
};
