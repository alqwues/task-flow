import { supabase } from './supabase';
import type { Task, Comment } from '../types';

export const tasksService = {
  async getTasks(columnIds: string[]): Promise<Task[]> {
    if (columnIds.length === 0) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('column_id', columnIds)
      .order('position');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const assigneeIds = [...new Set(data.filter((t) => t.assignee_id).map((t) => t.assignee_id as string))];
    if (assigneeIds.length === 0) return data;

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', assigneeIds);
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    return data.map((t) => ({ ...t, assignee: t.assignee_id ? (profileMap[t.assignee_id] ?? null) : null }));
  },

  async createTask(columnId: string, title: string, userId: string): Promise<Task> {
    const { data: existing } = await supabase
      .from('tasks')
      .select('position')
      .eq('column_id', columnId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const position = existing ? existing.position + 1 : 0;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ column_id: columnId, title, position, created_by: userId })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id'>>
  ): Promise<void> {
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) throw error;
  },

  async moveTask(taskId: string, columnId: string, position: number): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ column_id: columnId, position })
      .eq('id', taskId);

    if (error) throw error;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  async getComments(taskId: string): Promise<Comment[]> {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at');

    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    return comments.map((c) => ({ ...c, profile: profileMap[c.user_id] ?? null }));
  },

  async addComment(taskId: string, userId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select('*')
      .single();

    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { ...data, profile: profile ?? null };
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },
};
