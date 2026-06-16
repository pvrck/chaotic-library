import { supabase } from '@/lib/supabaseClient';
import { Book, EBookStatus } from '@/types/books.type';
import { ChallengePoolItem } from '@/types/challenges.type';
import { updateXpWithReason } from '@/utils/xpUtils';

/**
 * Déclenche un défi du chaos aléatoire en BDD si disponible
 */
export const triggerChaosChallenge = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userChallenges, error } = await supabase
    .from('user_challenges')
    .select('id, status, challenge_pool(*)')
    .eq('user_id', user.id)
    .neq('status', 'en_cours');

  if (error) throw error;

  if (userChallenges && userChallenges.length > 0) {
    const randomSelection = userChallenges[Math.floor(Math.random() * userChallenges.length)];
    const rawPool = randomSelection.challenge_pool;
    const randomChallengeArray: ChallengePoolItem[] = Array.isArray(rawPool)
      ? (rawPool as ChallengePoolItem[])
      : rawPool
        ? [rawPool as ChallengePoolItem]
        : [];
    const randomChallenge =
      randomChallengeArray && randomChallengeArray.length > 0 ? randomChallengeArray[0] : null;

    if (randomChallenge) {
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({ status: 'en_cours' })
        .eq('id', randomSelection.id);

      if (updateError) throw updateError;

      const bonus = randomChallenge.xp_bonus || 0;
      const malus = randomChallenge.xp_malus || 0;

      let txtXP = '';
      if (bonus > 0) txtXP = `+${bonus} XP`;
      if (malus > 0) txtXP = `-${malus} XP (Malus ! 💀)`;
      if (bonus > 0 && malus > 0) txtXP = `+${bonus} XP / -${malus} XP`;

      return `🔮 LE CHAOS A PARLÉ ! Nouveau défi débloqué : "${randomChallenge.title}" (${txtXP})`;
    }
  }
  return null;
};

/**
 * Calcule l'XP gagnée et met à jour le profil utilisateur
 */
export const handleXpGain = async (nextStatus: EBookStatus, targetBook?: Book) => {
  let xp = 0;
  let reason = '';

  // 1. Calcul de l'XP et définition de la raison
  switch (nextStatus) {
    case EBookStatus.EnCours:
      xp = 5;
      reason = `Début de lecture | ${targetBook?.title}`;
      break;
    case EBookStatus.Lu:
      xp = 120;
      reason = `Livre terminé | ${targetBook?.title}`;
      if (targetBook?.saga_name) {
        xp += 30;
        reason += ' (Bonus Saga)';
      }
      break;
    case EBookStatus.Abandonne:
      xp = 10;
      reason = `Livre abandonné | ${targetBook?.title}`;
      break;
  }

  if (xp <= 0) return;

  // 2. Récupération de l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // 3. Récupération de l'XP actuel
  const { data: prof } = await supabase.from('profiles').select('xp').eq('id', user.id).single();

  const currentXp = prof?.xp || 0;

  await updateXpWithReason(user.id, currentXp + xp, reason);
};
