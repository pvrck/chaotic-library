import { supabase } from '@/lib/supabaseClient';

export const updateXpWithReason = async (userId: string, newXp: number, reason: string) => {
  const { error } = await supabase.rpc('update_xp_with_reason', {
    target_user_id: userId,
    new_xp: newXp,
    log_reason: reason,
  });

  return { error };
};
