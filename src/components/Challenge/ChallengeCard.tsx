import { EChallengeStatus, UserChallengeBoard } from '@/types/challenges.type'; // Adapte selon tes types
import { CheckCircle2, Target, XCircle } from 'lucide-react';

interface ChallengeCardProps {
  challenge: UserChallengeBoard;
}

const statusChallenge = {
  [EChallengeStatus.EnCours]: 'En cours',
  [EChallengeStatus.Reussi]: 'Réussi',
  [EChallengeStatus.Echoue]: 'Echoué',
  [EChallengeStatus.Expire]: 'Expiré',
};

export const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const isCompleted = challenge.status === EChallengeStatus.Reussi;
  const isFailed = challenge.status === EChallengeStatus.Echoue;

  // Style dynamique selon le statut
  const getStatusStyles = () => {
    if (isCompleted) return 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20';
    if (isFailed) return 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20';
    return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${getStatusStyles()} transition-all shadow-sm hover:shadow-md`}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={`p-2 rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}
        >
          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {statusChallenge[challenge.status]}
        </span>
      </div>

      <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
        {challenge.challenge_pool.title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {challenge.challenge_pool.description}
      </p>

      {/* Barre de progression simple */}
      {!isCompleted && !isFailed && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(challenge.progress || 0, 100)}%` }}
          />
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold">
          <XCircle className="h-3 w-3" /> Défi compromis
        </div>
      )}
    </div>
  );
};
