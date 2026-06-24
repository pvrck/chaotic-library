import { useAuth } from '@/context/AuthContext';
import { EChallengeStatus, EChallengeType, UserChallenge } from '@/types/challenges.type';
import { Calendar, Dices, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ChallengeBlockProps {
  typeChallenge: EChallengeType;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  activeChallenges: UserChallenge[];
}

export const ChallengeBlock = ({
  typeChallenge,
  setRefreshTrigger,
  activeChallenges,
}: ChallengeBlockProps) => {
  const { profile } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const chaosChallenge = activeChallenges.find(
    (c) => c.challenge_pool?.type === EChallengeType.Chaos
  );
  const monthlyChallenge = activeChallenges.find(
    (c) => c.challenge_pool?.type === EChallengeType.Mensuel
  );

  // Déclencher un défi (générique pour Chaos ou Mensuel)
  const triggerChallenge = async (type: EChallengeType) => {
    if (!profile) return;

    const hasTypeInProg = activeChallenges.some((c) => c.challenge_pool?.type === type);
    if (hasTypeInProg) {
      alert(
        `Tu as déjà un défi ${type === EChallengeType.Chaos ? 'du Chaos' : 'Mensuel'} en cours !`
      );
      return;
    }

    setIsLoading(true);

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
      if (type === EChallengeType.Chaos) {
        expiresAt.setDate(expiresAt.getDate() + chosenChallenge.duration_days!);
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
          status: EChallengeStatus.EnCours,
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
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          {typeChallenge === EChallengeType.Mensuel && (
            <>
              <Calendar className="h-4 w-4 text-amber-500" /> Défi Mensuel
            </>
          )}
          {typeChallenge === EChallengeType.Chaos && (
            <>
              <Dices className="h-4 w-4 text-purple-500" /> Invoquer le Chaos
            </>
          )}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {typeChallenge === EChallengeType.Mensuel &&
            'Un grand objectif pour rythmer ton mois de lecture.'}
          {typeChallenge === EChallengeType.Chaos &&
            'Une contrainte imprévisible à durée limitée !'}
        </p>
      </div>
      <button
        onClick={() =>
          triggerChallenge(
            typeChallenge === EChallengeType.Mensuel ? EChallengeType.Mensuel : EChallengeType.Chaos
          )
        }
        disabled={
          isLoading ||
          (typeChallenge === EChallengeType.Mensuel ? !!monthlyChallenge : !!chaosChallenge)
        }
        className={`w-full mt-4 ${typeChallenge === EChallengeType.Mensuel ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-50 transition-all;`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        ) : typeChallenge === EChallengeType.Mensuel ? (
          monthlyChallenge ? (
            'DÉFI MENSUEL ACTIF'
          ) : (
            'ACTIVER LE DÉFI MENSUEL'
          )
        ) : chaosChallenge ? (
          'DÉFI CHAOS ACTIF'
        ) : (
          'INVOQUER LE CHAOS'
        )}
      </button>
    </div>
  );
};
