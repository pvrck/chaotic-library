import ChallengeBoard from '@/components/Dashboard/ChallengeBoard';
import { ExperienceBar } from '@/components/Dashboard/ExperienceBar';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage = () => {
  const { profile } = useAuth();

  const username = profile?.username || 'Lectrice Mystère';

  return (
    <div className="animate-in fade-in duration-200">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="space-y-1 py-2">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            Bienvenue, <span className="text-indigo-600 dark:text-indigo-400">{username}</span> ! 👋
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Prête à relever les défis de la bibliothèque aujourd'hui ?
          </p>
        </div>

        <ExperienceBar />
        <ChallengeBoard />
      </div>
    </div>
  );
};
