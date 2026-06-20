import { supabase } from '@/lib/supabaseClient';
import { challengeValidator } from '@/services/challengeValidator';
import {
  ChallengeCondition,
  EChallengeStatus,
  EConditionType,
  EOperator,
} from '@/types/challenges.type';

export async function checkAndUnlockChallenges(userId: string) {
  // 1. Récupérer le défi en cours de l'utilisateur
  const { data: userChallenge } = await supabase
    .from('user_challenges')
    .select('*, challenge_pool(*)')
    .eq('user_id', userId)
    .eq('status', EChallengeStatus.EnCours)
    .single();

  if (!userChallenge) return;

  // 2. Valider avec notre moteur
  const condition = userChallenge.challenge_pool.condition as unknown as ChallengeCondition;

  if (!condition || !condition.type) {
    console.error('Structure de défi invalide en base de données');
    return false;
  }

  const isComplete = await challengeValidator.evaluate(userId, condition);

  // 3. Mettre à jour si réussi
  if (isComplete) {
    await supabase
      .from('user_challenges')
      .update({ status: EChallengeStatus.Reussi, completed_at: new Date().toISOString() })
      .eq('id', userChallenge.id);
    return 'SUCCESS';
  }

  // Logique pour détecter l'échec d'un défi "NoAbandon"
  if (condition.type === EConditionType.NoAbandon && condition.operator === EOperator.Lte) {
    // Si on dépasse le seuil (ici 0), on marque comme échoué
    await supabase
      .from('user_challenges')
      .update({ status: EChallengeStatus.Echoue })
      .eq('id', userChallenge.id);
    return 'FAILED';
  }

  return 'NONE';
}
