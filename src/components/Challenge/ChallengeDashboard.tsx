import { supabase } from '@/lib/supabaseClient';
import { challengeValidator } from '@/services/challengeValidator';
import {
  ChallengeCondition,
  EChallengeStatus,
  EChallengeType,
  UserChallengeBoard,
} from '@/types/challenges.type';
import { useEffect, useState } from 'react';
import { ChallengeCard } from './ChallengeCard';

export default function ChallengeDashboard({ userId }: { userId: string }) {
  const [challenges, setChallenges] = useState<UserChallengeBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChallenges() {
      setLoading(true);

      // 1. Récupérer les défis depuis Supabase
      const { data: userChallenges, error } = await supabase
        .from('user_challenges')
        .select(
          `
    *,
    challenge_pool!inner (*) 
  `
        )
        .eq('user_id', userId)
        .eq('status', EChallengeStatus.EnCours)
        .eq('challenge_pool.type', EChallengeType.Mensuel);

      if (error) {
        console.error('Erreur chargement défis:', error);
        return;
      }

      // 2. Enrichir avec la progression calculée dynamiquement
      const mapStatusToEnum = (status: string | null): EChallengeStatus => {
        switch (status) {
          case 'en_cours':
            return EChallengeStatus.EnCours;
          case 'reussi':
            return EChallengeStatus.Reussi;
          case 'echoue':
            return EChallengeStatus.Echoue;
          case 'expire':
            return EChallengeStatus.Expire;
          default:
            return EChallengeStatus.EnCours;
        }
      };

      const enrichedChallenges = await Promise.all(
        userChallenges.map(async (c): Promise<UserChallengeBoard> => {
          // 1. Calculer le status une seule fois pour tout le monde
          const cleanStatus = mapStatusToEnum(c.status);

          // 2. Calculer la progression
          const condition = c.challenge_pool?.condition as unknown as ChallengeCondition;
          const progress =
            condition && c.challenge_pool?.condition
              ? await challengeValidator.getProgress(userId, condition)
              : 0;

          // 3. Retourner l'objet strictement typé
          return {
            id: c.id,
            user_id: c.user_id,
            challenge_id: c.challenge_id,
            status: cleanStatus, // Le status est maintenant toujours un EChallengeStatus
            activated_at: c.activated_at,
            completed_at: c.completed_at,
            expires_at: c.expires_at,
            challenge_pool: c.challenge_pool,
            progress: progress,
          } as UserChallengeBoard;
        })
      );

      setChallenges(enrichedChallenges);
      setLoading(false);
    }

    loadChallenges();
  }, [userId]);

  if (loading) return <div>Chargement de tes défis...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">
        Tes défis du mois
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
