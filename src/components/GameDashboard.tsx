import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile, UserChallenge } from '@/types';
import { Sparkles, Trophy, Loader2, Dices, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface GameDashboardProps {
  profile: Profile | null;
  onXpChanged: () => void; // Pour dire au parent de rafraîchir le profil
}

export default function GameDashboard({ profile, onXpChanged }: GameDashboardProps) {
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);

  // Formule RPG simple : 1 niveau tous les 1000 XP
  const xpPerLevel = 1000;
  const currentXp = profile?.xp || 0;
  const currentLevel = Math.floor(currentXp / xpPerLevel) + 1;
  const xpInCurrentLevel = currentXp % xpPerLevel;
  const xpPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

  const fetchActiveChallenges = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // On récupère les défis en cours de l'utilisateur, en joignant les infos du pool
      const { data, error } = await supabase
        .from('user_challenges')
        .select(
          `
          *,
          challenge_pool:challenge_id (*)
        `
        )
        .eq('user_id', profile.id)
        .eq('status', 'en_cours');

      if (error) throw error;
      setActiveChallenges(data || []);
    } catch (error) {
      console.error('Erreur défis actifs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchActiveChallenges();
    })();
  }, [profile]);

  // Fonction magique : Lancer le Dé du Chaos
  const triggerChaosChallenge = async () => {
    if (!profile || rolling) return;

    // Anti-triche : Vérifier si on a déjà un défi Chaos en cours
    const hasChaosInProg = activeChallenges.some((c) => c.challenge_pool?.type === 'chaos');
    if (hasChaosInProg) {
      alert(
        "Tu as déjà un défi du Chaos en cours ! Termine-le (ou échoue-le) avant d'en invoquer un autre. 😉"
      );
      return;
    }

    setRolling(true);
    try {
      // 1. Récupérer tous les défis Chaos disponibles dans le pool
      const { data: poolItems, error: poolError } = await supabase
        .from('challenge_pool')
        .select('*')
        .eq('type', 'chaos');

      if (poolError) throw poolError;
      if (!poolItems || poolItems.length === 0) {
        alert(
          "La fabrique à défis est vide ! Ajoute des défis de type 'Chaos' dans l'espace Admin d'abord."
        );
        return;
      }

      // 2. Tirage au sort !
      const randomIndex = Math.floor(Math.random() * poolItems.length);
      const chosenChallenge = poolItems[randomIndex];

      // 3. Calculer la date d'expiration (now + duration_days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + chosenChallenge.duration_days);

      // 4. Insérer le défi actif
      const { error: insertError } = await supabase.from('user_challenges').insert([
        {
          user_id: profile.id,
          challenge_id: chosenChallenge.id,
          status: 'en_cours',
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Recharger les défis
      await fetchActiveChallenges();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erreur lors de l'invocation du Chaos...";
      alert(msg);
    } finally {
      setRolling(false);
    }
  };

  // Résolution du défi : Succès ou Échec
  const handleResolveChallenge = async (userChallenge: UserChallenge, isSuccess: boolean) => {
    if (!profile) return;
    const challenge = userChallenge.challenge_pool;
    if (!challenge) return;

    const xpChange = isSuccess ? challenge.xp_bonus : -challenge.xp_malus;
    const newXp = Math.max(0, (profile.xp || 0) + xpChange); // Pas d'XP négative globale

    try {
      // 1. Mettre à jour le statut du défi
      const { error: challengeError } = await supabase
        .from('user_challenges')
        .update({
          status: isSuccess ? 'reussi' : 'echoue',
          completed_at: new Date().toISOString(),
        })
        .eq('id', userChallenge.id);

      if (challengeError) throw challengeError;

      // 2. Mettre à jour l'XP sur le profil de l'utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // /!\ IMPORTANT : On attend que l'alerte soit passée OU on appelle d'abord la mise à jour
      // pour éviter que le thread synchrone du 'alert()' ne bloque le rechargement de l'XP.
      await onXpChanged();
      await fetchActiveChallenges();

      if (isSuccess) {
        alert(`🎉 Défi réussi ! +${challenge.xp_bonus} XP engrangés !`);
      } else {
        alert(`💀 Défi échoué... ${challenge.xp_malus} XP de perdus. Le Chaos ne pardonne pas !`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la validation du défi.';
      alert(msg);
    }
  };

  // Petite fonction pour formater le compte à rebours proprement
  const getDaysLeft = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return null;
    const diffTime = new Date(expiryDateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} jours restants` : 'Temps écoulé !';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 🏆 CARTE DE STATS & NIVEAU RPG */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy className="h-32 w-32 text-indigo-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
              Statut de la lectrice
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              Niveau {currentLevel}{' '}
              <span className="text-slate-400 text-sm font-normal">({currentXp} XP au total)</span>
            </h2>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block">Prochain niveau</span>
            <span className="text-sm font-bold text-slate-200">
              {xpInCurrentLevel} / {xpPerLevel} XP
            </span>
          </div>
        </div>

        {/* Barre de progression XP */}
        <div className="w-full bg-slate-800 h-3 rounded-full mt-4 overflow-hidden p-[2px] border border-slate-700">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* 🎲 LA ZONE DU CHAOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne de gauche : Lancement */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Dices className="h-5 w-5 text-purple-500" /> Invoquer le Chaos
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Prête à pimenter tes lectures ? Clique sur le bouton pour piocher instantanément un
              défi aléatoire du réservoir. Attention, un compte à rebours se lance !
            </p>
          </div>

          <button
            onClick={triggerChaosChallenge}
            disabled={rolling}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform active:scale-98 disabled:opacity-50"
          >
            {rolling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            LANCER LE DÉ DU CHAOS
          </button>
        </div>

        {/* Colonne du milieu/droite : Défis en cours */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Défis Actifs ({activeChallenges.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : activeChallenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-xl">
              <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 italic">
                Aucun défi actif pour le moment. Le calme avant la tempête...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeChallenges.map((userChal) => {
                const item = userChal.challenge_pool;
                if (!item) return null;
                const daysLeft = getDaysLeft(userChal.expires_at);

                return (
                  <div
                    key={userChal.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/40 gap-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            item.type === 'chaos'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {item.type === 'chaos' ? '🎲 CHAOS' : '📅 MENSUEL'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {item.title}
                        </h4>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        {daysLeft && (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {daysLeft}
                          </span>
                        )}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          +{item.xp_bonus} XP
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
                          -{item.xp_malus} XP
                        </span>
                      </div>
                    </div>

                    {/* Actions de Résolution */}
                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                      <button
                        onClick={() => handleResolveChallenge(userChal, true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Réussi
                      </button>
                      <button
                        onClick={() => handleResolveChallenge(userChal, false)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Échoué
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
