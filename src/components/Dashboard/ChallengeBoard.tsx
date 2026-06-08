import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserChallenge } from '@/types/challenges.type';
import { useAuth } from '@/context/AuthContext';
import { EChallengeType } from '@/types/challenges.type';
import { ActiveChallenges } from './ActiveChallenges';
import { ChallengeBlock } from './ChallengeBlock';

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
      .eq('status', 'en_cours')
      .then(({ data }) => {
        setActiveChallenges(data || []);
        setLoading(false);
      });
  }, [profile, refreshTrigger]);

  return (
    <>
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

      <ActiveChallenges
        setRefreshTrigger={setRefreshTrigger}
        loading={loading}
        activeChallenges={activeChallenges}
      />
    </>
  );
};
