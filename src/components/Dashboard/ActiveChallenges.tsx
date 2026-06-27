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

  // 🔍 On s'assure d'isoler uniquement les défis du Chaos ici
  const chaosChallenges = activeChallenges.filter(
    (uc) =>
      uc.challenge_pool?.type === EChallengeType.Chaos ||
      String(uc.challenge_pool?.type).toLowerCase() === 'chaos'
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Défi du chaos en cours</h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      ) : chaosChallenges.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">
          Aucun événement chaotique ne perturbe ta bibliothèque pour le moment... 🌌
        </p>
      ) : (
        <div className="space-y-3">
          {chaosChallenges.map((uc) => {
            const item = uc.challenge_pool;
            if (!item) return null;

            return (
              <div
                key={uc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50 gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                      CHAOS
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  <div className="text-[10px] mt-1 space-x-2">
                    <span className="text-purple-600 font-semibold">
                      {getDaysLeft(uc.expires_at)}
                    </span>
                    <span className="text-emerald-600 font-medium">+{item.xp_bonus} XP</span>
                    <span className="text-rose-600 font-medium">-{item.xp_malus} XP</span>
                  </div>
                </div>

                {/* 🌟 Les boutons de validation manuelle pour l'utilisateur */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleResolveChallenge(uc, true)}
                    className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Réussi
                  </button>
                  <button
                    onClick={() => handleResolveChallenge(uc, false)}
                    className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
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
