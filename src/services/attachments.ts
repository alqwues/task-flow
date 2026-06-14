import { supabase } from './supabase';

export interface Attachment {
  id: string;
  task_id: string;
  name: string;
  url: string;
  size: number;
  uploaded_by: string | null;
  created_at: string;
}

export const attachmentsService = {
  async getAttachments(taskId: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async upload(taskId: string, file: File, userId: string): Promise<Attachment> {
    const path = `${taskId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: storageError } = await supabase.storage
      .from('task-files')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage.from('task-files').getPublicUrl(path);

    const { data, error } = await supabase
      .from('task_attachments')
      .insert({ task_id: taskId, name: file.name, url: publicUrl, size: file.size, uploaded_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAttachment(id: string, url: string): Promise<void> {
    try {
      const match = url.match(/task-files\/(.+)$/);
      if (match?.[1]) {
        await supabase.storage.from('task-files').remove([decodeURIComponent(match[1])]);
      }
    } catch {
      // storage delete failure is non-fatal
    }
    await supabase.from('task_attachments').delete().eq('id', id);
  },
};
