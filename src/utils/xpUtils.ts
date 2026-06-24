import { supabase } from '@/lib/supabaseClient';

export const getCurrentXp = async (userId: string) => {
  const { data: prof } = await supabase.from('profiles').select('xp').eq('id', userId).single();

  const currentXp = prof?.xp || 0;

  return { currentXp };
};

export const updateXpWithReason = async (userId: string, newXp: number, reason: string) => {
  // Si newXp est négatif (ex: -10), Math.max le force à 0.
  const secureXp = Math.max(0, newXp);

  const { error } = await supabase.rpc('update_xp_with_reason', {
    target_user_id: userId,
    new_xp: secureXp, // On envoie la valeur sécurisée (minimum 0)
    log_reason: reason,
  });

  return { error };
};
