import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile, UserChallenge } from '@/types';
import { Calendar, Loader2, Dices, CheckCircle2, XCircle } from 'lucide-react';

interface GameDashboardProps {
  profile: Profile | null;
  onXpChanged: () => void;
}

export default function GameDashboard({ profile, onXpChanged }: GameDashboardProps) {
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingChaos, setRollingChaos] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const xpPerLevel = 1000;
  const currentXp = profile?.xp || 0;
  const currentLevel = Math.floor(currentXp / xpPerLevel) + 1;
  const xpInCurrentLevel = currentXp % xpPerLevel;
  const xpPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

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

  // Déclencher un défi (générique pour Chaos ou Mensuel)
  const triggerChallenge = async (type: 'chaos' | 'mensuel') => {
    if (!profile) return;

    const hasTypeInProg = activeChallenges.some((c) => c.challenge_pool?.type === type);
    if (hasTypeInProg) {
      alert(`Tu as déjà un défi ${type === 'chaos' ? 'du Chaos' : 'Mensuel'} en cours !`);
      return;
    }

    if (type === 'chaos') {
      setRollingChaos(true);
    } else {
      setLoadingMonthly(true);
    }

    try {
      const { data: poolItems, error: poolError } = await supabase
        .from('challenge_pool')
        .select('*')
        .eq('type', type);

      if (poolError) throw poolError;
      if (!poolItems || poolItems.length === 0) {
        alert(`Aucun défi de type '${type}' dans la fabrique à défis.`);
        return;
      }

      // Tirage au sort (Pour le mensuel, on pourrait affiner plus tard, mais le hasard du pool convient très bien pour l'instant)
      const randomIndex = Math.floor(Math.random() * poolItems.length);
      const chosenChallenge = poolItems[randomIndex];

      const expiresAt = new Date();
      if (type === 'chaos') {
        expiresAt.setDate(expiresAt.getDate() + chosenChallenge.duration_days);
      } else {
        // Fin du mois en cours pour le défi mensuel
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        expiresAt.setDate(0); // Dernier jour du mois
        expiresAt.setHours(23, 59, 59, 999);
      }

      const { error: insertError } = await supabase.from('user_challenges').insert([
        {
          user_id: profile.id,
          challenge_id: chosenChallenge.id,
          status: 'en_cours',
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (insertError) throw insertError;
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur activation défi:', msg);
      alert("Erreur lors de l'activation du défi.");
    } finally {
      if (type === 'chaos') {
        setRollingChaos(false);
      } else {
        setLoadingMonthly(false);
      }
    }
  };

  const handleResolveChallenge = async (userChallenge: UserChallenge, isSuccess: boolean) => {
    if (!profile || !userChallenge.challenge_pool) return;
    const challenge = userChallenge.challenge_pool;

    const xpChange = isSuccess ? challenge.xp_bonus : -challenge.xp_malus;
    const newXp = Math.max(0, (profile.xp || 0) + xpChange);

    try {
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({
          status: isSuccess ? 'reussi' : 'echoue',
          completed_at: new Date().toISOString(),
        })
        .eq('id', userChallenge.id);

      if (challengeError) throw challengeError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      await onXpChanged();
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

  const chaosChallenge = activeChallenges.find((c) => c.challenge_pool?.type === 'chaos');
  const monthlyChallenge = activeChallenges.find((c) => c.challenge_pool?.type === 'mensuel');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 🏆 BARRE RPG */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
              Statut de la lectrice
            </span>
            <h2 className="text-2xl font-black mt-1 flex items-center gap-2">
              Niveau {currentLevel}{' '}
              <span className="text-slate-400 text-sm font-normal">({currentXp} XP)</span>
            </h2>
          </div>
          <div className="text-sm font-bold text-slate-200">
            {xpInCurrentLevel} / {xpPerLevel} XP
          </div>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full mt-4 overflow-hidden p-[2px] border border-slate-700">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* 🎲 ACTIONS DE JEU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lancer Mensuel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-500" /> Défi Mensuel
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Un grand objectif pour rythmer ton mois de lecture.
            </p>
          </div>
          <button
            onClick={() => triggerChallenge('mensuel')}
            disabled={loadingMonthly || !!monthlyChallenge}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50 transition-all"
          >
            {loadingMonthly ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : monthlyChallenge ? (
              'DÉFI MENSUEL ACTIF'
            ) : (
              'ACTIVER LE DÉFI MENSUEL'
            )}
          </button>
        </div>

        {/* Lancer Chaos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Dices className="h-4 w-4 text-purple-500" /> Invoquer le Chaos
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Une contrainte imprévisible à durée limitée !
            </p>
          </div>
          <button
            onClick={() => triggerChallenge('chaos')}
            disabled={rollingChaos || !!chaosChallenge}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50 transition-all"
          >
            {rollingChaos ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : chaosChallenge ? (
              'DÉFI CHAOS ACTIF'
            ) : (
              'INVOQUER LE CHAOS'
            )}
          </button>
        </div>
      </div>

      {/* 📋 AFFICHAGE DES DÉFIS ACTIFS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 space-y-4">
        <h3 className="text-sm font-bold">Quêtes en cours ({activeChallenges.length})</h3>
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
            {activeChallenges.map((uc) => {
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
    </div>
  );
}
