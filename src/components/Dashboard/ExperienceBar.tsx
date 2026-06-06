import { useAuth } from '@/context/AuthContext';

export const ExperienceBar = () => {
  const { profile } = useAuth();

  const xpPerLevel = 1000;
  const currentXp = profile?.xp || 0;
  const currentLevel = Math.floor(currentXp / xpPerLevel) + 1;
  const xpInCurrentLevel = currentXp % xpPerLevel;
  const xpPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

  return (
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
  );
};
