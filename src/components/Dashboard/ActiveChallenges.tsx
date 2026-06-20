import { useAuth } from '@/context/AuthContext';
import { EChallengeStatus, EChallengeType, UserChallenge } from '@/types/challenges.type';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { updateXpWithReason } from '@/utils/xpUtils';

interface ActiveChallengesProps {
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  activeChallenges: UserChallenge[];
}

export const ActiveChallenges = ({
  setRefreshTrigger,
  loading,
  activeChallenges,
}: ActiveChallengesProps) => {
  const { profile, refreshProfile } = useAuth();

  const handleResolveChallenge = async (userChallenge: UserChallenge, isSuccess: boolean) => {
    if (!profile || !userChallenge.challenge_pool) return;
    const challenge = userChallenge.challenge_pool;

    const xpChange = isSuccess ? challenge.xp_bonus : -challenge.xp_malus;
    const newXp = Math.max(0, (profile.xp || 0) + xpChange);

    try {
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({
          status: isSuccess ? EChallengeStatus.Reussi : EChallengeStatus.Echoue,
          completed_at: new Date().toISOString(),
        })
        .eq('id', userChallenge.id);

      if (challengeError) throw challengeError;

      const reason = isSuccess
        ? `Défi réussi : ${challenge.title}`
        : `Défi échoué : ${challenge.title}`;

      const { error: profileError } = await updateXpWithReason(profile.id, newXp, reason);

      if (profileError) throw profileError;

      await refreshProfile();
      setRefreshTrigger((prev) => prev + 1);

      alert(isSuccess ? `🎉 +${challenge.xp_bonus} XP !` : `💀 -${challenge.xp_malus} XP...`);
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la résolution.');
    }
  };

  const getDaysLeft = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return null;
    const diffTime = new Date(expiryDateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} jours restants` : 'Temps écoulé !';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 space-y-4">
      <h3 className="text-sm font-bold">Défi du chaos en cours</h3>
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      ) : activeChallenges.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">
          Aucun défi actif. Viens en activer un ci-dessus !
        </p>
      ) : (
        <div className="space-y-3">
          {activeChallenges.filter((uc) => uc.challenge_pool?.type !== EChallengeType.Mensuel)
            .length === 0 && <p className="text-xs text-slate-400 mt-1">Aucun défi en cours</p>}
          {activeChallenges
            .filter((uc) => uc.challenge_pool?.type !== EChallengeType.Mensuel)
            .map((uc) => {
              const item = uc.challenge_pool;
              if (!item) return null;
              return (
                <div
                  key={uc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50 gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.type === 'chaos' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      <h4 className="text-xs font-bold">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                    <div className="text-[10px] mt-1 space-x-2">
                      <span className="text-purple-600 font-semibold">
                        {getDaysLeft(uc.expires_at)}
                      </span>
                      <span className="text-emerald-600">+{item.xp_bonus} XP</span>
                      <span className="text-rose-600">-{item.xp_malus} XP</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveChallenge(uc, true)}
                      className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Réussi
                    </button>
                    <button
                      onClick={() => handleResolveChallenge(uc, false)}
                      className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-rose-100"
                    >
                      <XCircle className="h-3 w-3" /> Échoué
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
