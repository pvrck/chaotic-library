import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChallengePoolItem, EChallengeStatus, UserChallenge } from '@/types/challenges.type';
import { useAuth } from '@/context/AuthContext';
import { EChallengeType } from '@/types/challenges.type';
import { ActiveChallenges } from './ActiveChallenges';
import { ChallengeBlock } from './ChallengeBlock';
import ChallengeDashboard from '../Challenge/ChallengeDashboard';

export const ChallengeBoard = () => {
  const { profile } = useAuth();

  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('user_challenges')
      .select('*, challenge_pool:challenge_id (*)')
      .eq('user_id', profile.id)
      .eq('status', EChallengeStatus.EnCours)
      .then(({ data }) => {
        const typedData: UserChallenge[] = (data || []).map((item) => {
          // Normalisation de challenge_pool
          const poolData = Array.isArray(item.challenge_pool)
            ? item.challenge_pool[0]
            : item.challenge_pool;

          return {
            id: item.id,
            user_id: item.user_id,
            status: item.status as EChallengeStatus,
            // Ajout des champs manquants qui manquaient à l'appel
            challenge_id: item.challenge_id,
            activated_at: item.activated_at || null,
            expires_at: item.expires_at || null,
            completed_at: item.completed_at || null,
            // Mapping de l'objet pool
            challenge_pool: {
              ...poolData,
              type: (poolData?.type as EChallengeType) || EChallengeType.Mensuel,
              title: poolData?.title || 'Titre inconnu',
              description: poolData?.description || '',
              xp_bonus: poolData?.xp_bonus || 0,
              xp_malus: poolData?.xp_malus || 0,
            } as ChallengePoolItem,
          };
        });
        setActiveChallenges(typedData);
        setLoading(false);
      });
  }, [profile, refreshTrigger]);

  return (
    <>
      {profile?.id && <ChallengeDashboard userId={profile.id} refreshTrigger={refreshTrigger} />}

      <ActiveChallenges
        setRefreshTrigger={setRefreshTrigger}
        loading={loading}
        activeChallenges={activeChallenges}
      />

      {/* 🎲 ACTIONS DE JEU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lancer Mensuel */}
        <ChallengeBlock
          typeChallenge={EChallengeType.Mensuel}
          setRefreshTrigger={setRefreshTrigger}
          activeChallenges={activeChallenges}
        />

        {/* Lancer Chaos */}
        <ChallengeBlock
          typeChallenge={EChallengeType.Chaos}
          setRefreshTrigger={setRefreshTrigger}
          activeChallenges={activeChallenges}
        />
      </div>
    </>
  );
};
