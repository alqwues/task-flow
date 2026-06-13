import { supabase } from './supabase';
import type { Profile } from '../types';

export const profilesService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url'>>): Promise<void> {
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates });
    if (error) throw error;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  },
};
