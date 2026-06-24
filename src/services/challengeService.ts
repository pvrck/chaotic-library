import { supabase } from '@/lib/supabaseClient';
import { challengeValidator } from '@/services/challengeValidator';
import {
  ChallengeCondition,
  EChallengeStatus,
  EConditionType,
  EOperator,
} from '@/types/challenges.type';
import { getCurrentXp, updateXpWithReason } from '@/utils/xpUtils';

export async function checkAndUnlockChallenges(userId: string) {
  // 1. Récupérer les défis en cours (on utilise une boucle suite à notre correction précédente)
  const { data: userChallenges } = await supabase
    .from('user_challenges')
    .select('*, challenge_pool(*)')
    .eq('user_id', userId)
    .eq('status', EChallengeStatus.EnCours);

  if (!userChallenges || userChallenges.length === 0) return 'NONE';

  let statusResult = 'NONE';

  for (const userChallenge of userChallenges) {
    const condition = userChallenge.challenge_pool.condition as unknown as ChallengeCondition;

    if (!condition || !condition.type) {
      console.error('Structure de défi invalide en base de données');
      continue;
    }

    const isComplete = await challengeValidator.evaluate(userId, condition);

    // 2. Si le défi est réussi ! 🏆
    if (isComplete) {
      // A. On passe le défi à Réussi
      await supabase
        .from('user_challenges')
        .update({ status: EChallengeStatus.Reussi, completed_at: new Date().toISOString() })
        .eq('id', userChallenge.id);

      // B. 🌟 ATTRIBUTION DES XP
      try {
        // 1. On récupère les XP actuels de l'utilisateur
        const { currentXp } = await getCurrentXp(userId);

        // 2. On récupère la récompense du défi
        const xpReward = userChallenge.challenge_pool.xp_bonus || 50; // 50 XP par défaut si vide

        const newXpTotal = currentXp + xpReward;
        const reason = `Défi réussi : ${userChallenge.challenge_pool.title || 'Défi Mensuel'}`;

        // 3. On appelle ta fonction RPC pour sauvegarder et historiser !
        await updateXpWithReason(userId, newXpTotal, reason);
      } catch (xpErr) {
        console.error("Erreur lors de l'attribution des XP du défi :", xpErr);
      }

      statusResult = 'SUCCESS';
      break; // On peut s'arrêter là ou enlever le break si tu veux cumuler plusieurs réussites d'un coup
    }

    // Logique NoAbandon (inchangée)
    if (condition.type === EConditionType.NoAbandon && condition.operator === EOperator.Lte) {
      await supabase
        .from('user_challenges')
        .update({ status: EChallengeStatus.Echoue })
        .eq('id', userChallenge.id);
      statusResult = 'FAILED';
    }
  }

  return statusResult;
}
