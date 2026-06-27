import { supabase } from '@/lib/supabaseClient';
import { Book, EBookStatus } from '@/types/books.type';
import { ChallengePoolItem, EChallengeStatus, EChallengeType } from '@/types/challenges.type';
import { getCurrentXp, updateXpWithReason } from '@/utils/xpUtils';

/**
 * Déclenche un défi du chaos aléatoire en BDD si disponible
 */
export const triggerChaosChallenge = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 🌟 MODIFICATION ICI : On filtre sur le type du challenge_pool directement dans la requête
  const { data: userChallenges, error } = await supabase
    .from('user_challenges')
    .select('id, status, challenge_pool(*)')
    .eq('user_id', user.id)
    .neq('status', EChallengeStatus.EnCours)
    .eq('challenge_pool.type', EChallengeType.Chaos);

  if (error) throw error;

  // À cause du filtre sur la table jointe, Supabase peut retourner des lignes
  // où challenge_pool est null (si c'était un mensuel). On filtre donc le tableau en JS pour être 100% safe :
  const validChaosChallenges = (userChallenges || []).filter((uc) => {
    const pool = uc.challenge_pool;
    if (!pool) return false;
    // Si c'est un tableau (cas des relations Supabase parfois), on vérifie le premier élément
    if (Array.isArray(pool)) {
      return pool[0]?.type === 'chaos';
    }
    return pool.type === 'chaos';
  });

  if (validChaosChallenges.length > 0) {
    // 🎲 On pioche uniquement parmi les VRAIS défis du chaos valides
    const randomSelection =
      validChaosChallenges[Math.floor(Math.random() * validChaosChallenges.length)];
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
  const { currentXp } = await getCurrentXp(user.id);

  await updateXpWithReason(user.id, currentXp + xp, reason);
};
