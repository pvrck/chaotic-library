import { supabase } from '@/lib/supabaseClient';

export interface UserGoal {
  id?: string;
  year: number;
  target_count: number;
}

export const getGoalByYear = async (year: number) => {
  const { data, error } = await supabase.from('user_goals').select('*').eq('year', year).single();

  if (error && error.code !== 'PGRST116') throw error; // Ignorer l'erreur "not found"
  return data as UserGoal | null;
};

export const saveGoalForYear = async (year: number, target_count: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { error } = await supabase
    .from('user_goals')
    .upsert({ user_id: user.id, year, target_count }, { onConflict: 'user_id, year' });
  if (error) throw error;
};
