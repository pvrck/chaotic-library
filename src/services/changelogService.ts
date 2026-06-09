import { supabase } from '@/lib/supabaseClient';
import { Changelog } from '@/types/changelog.type';

export const getChangelogs = async (): Promise<Changelog[]> => {
  const { data, error } = await supabase
    .from('changelogs')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Changelog[];
};

export const createChangelog = async (data: Omit<Changelog, 'id' | 'created_at'>) => {
  const { data: newLog, error } = await supabase.from('changelogs').insert([data]).select();

  if (error) throw new Error(error.message);
  return newLog;
};

export const updateChangelog = async (
  id: number | string,
  data: Partial<Omit<Changelog, 'id' | 'created_at'>>
) => {
  const { data: updatedLog, error } = await supabase
    .from('changelogs')
    .update(data)
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return updatedLog;
};
