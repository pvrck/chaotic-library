import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy } from 'lucide-react';
import { Achievement } from '@/types/achievement.type';

interface UserGoalRow {
  year: number;
  target_count: number;
}

export const AchievementsGrid = ({ userId }: { userId: string | undefined }) => {
  const [all, setAll] = useState<Achievement[]>([]);
  // On récupère 'achievement_id' et 'unlocked_at'
  const [unlocked, setUnlocked] = useState<{ achievement_id: string; unlocked_at: string }[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoalRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      const { data: defs } = await supabase.from('achievements_definitions').select('*');

      // On sélectionne unlocked_at pour en extraire l'année plus tard
      const { data: userAch } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      const { data: goals } = await supabase
        .from('user_goals')
        .select('year, target_count')
        .eq('user_id', userId)
        .order('year', { ascending: true });

      if (defs) setAll(defs as unknown as Achievement[]);
      if (userAch) setUnlocked(userAch as { achievement_id: string; unlocked_at: string }[]);
      if (goals) setUserGoals(goals as UserGoalRow[]);
    };
    fetch();
  }, [userId]);

  const standardAchievements = all.filter((ach) => ach.condition_type !== 'livres_objectif');
  const goalDefinition = all.find((ach) => ach.condition_type === 'livres_objectif');

  const currentYear = new Date().getFullYear();

  // Génération des tuiles virtuelles à partir des objectifs
  const dynamicGoalAchievements = userGoals
    .filter((goal) => goal.year < currentYear) // <-- CHANGEMENT ICI : Strictement inférieur à l'année en cours
    .map((goal) => {
      // Le reste de ton code reste le même, simple et propre :
      const isUnlocked = unlocked.some((u) => {
        if (!u.unlocked_at) return false;

        const dateDate = new Date(u.unlocked_at);
        const unlockedYear = dateDate.getFullYear();
        const unlockedMonth = dateDate.getMonth(); // 0 = Janvier, 11 = Décembre

        if (u.achievement_id !== goalDefinition?.id) return false;

        // Le succès est valide si débloqué en décembre de l'année X ou en janvier de l'année X + 1
        return (
          (unlockedYear === goal.year && unlockedMonth === 11) ||
          (unlockedYear === goal.year + 1 && unlockedMonth === 0)
        );
      });

      return {
        id: `${goalDefinition?.id}-${goal.year}`,
        title: `Objectif de lecture ${goal.year}`,
        description: isUnlocked
          ? `Objectif de ${goal.target_count} livres atteint ! Félicitations.`
          : `Objectif de ${goal.target_count} livres non atteint cette année-là.`,
        isUnlocked: isUnlocked,
      };
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Succès Standards */}
      {standardAchievements.map((ach) => {
        const isUnlocked = ach.id && unlocked.some((u) => u.achievement_id === ach.id);
        return (
          <div
            key={ach.id}
            className={`p-4 rounded-2xl border ${isUnlocked ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 opacity-60'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isUnlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
              >
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{ach.title}</h4>
                <p className="text-[10px] text-slate-500">{ach.description}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* 2. Succès Annuels Virtuels */}
      {dynamicGoalAchievements.map((ach) => (
        <div
          key={ach.id}
          className={`p-4 rounded-2xl border ${ach.isUnlocked ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 opacity-60'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${ach.isUnlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
            >
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">{ach.title}</h4>
              <p className="text-[10px] text-slate-500">{ach.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
