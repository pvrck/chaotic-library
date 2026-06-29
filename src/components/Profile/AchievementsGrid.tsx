import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy } from 'lucide-react';
import { Achievement } from '@/types/achievement.type';

interface UserGoalRow {
  year: number;
  target_count: number;
}

interface AchievementsGridProps {
  userId: string | undefined;
  onlyShowUnlocked?: boolean;
}

export const AchievementsGrid = ({ userId, onlyShowUnlocked = false }: AchievementsGridProps) => {
  const [all, setAll] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<{ achievement_id: string; unlocked_at: string }[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const { data: defs } = await supabase.from('achievements_definitions').select('*');

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
      } catch (err) {
        console.error('Erreur chargement succès:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const standardAchievements = all.filter((ach) => ach.condition_type !== 'livres_objectif');
  const goalDefinition = all.find((ach) => ach.condition_type === 'livres_objectif');

  const currentYear = new Date().getFullYear();

  // Génération des tuiles virtuelles à partir des objectifs
  const dynamicGoalAchievements = userGoals
    .filter((goal) => goal.year < currentYear)
    .map((goal) => {
      const isUnlocked = unlocked.some((u) => {
        if (!u.unlocked_at) return false;

        const dateDate = new Date(u.unlocked_at);
        const unlockedYear = dateDate.getFullYear();
        const unlockedMonth = dateDate.getMonth();

        if (u.achievement_id !== goalDefinition?.id) return false;

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

  if (loading) {
    return (
      <div className="text-center py-8 text-xs text-slate-400 italic">
        Chargement des trophées... 🏆
      </div>
    );
  }

  // 🌟 Filtrage des listes si on ne veut voir QUE le palmarès débloqué
  const displayedStandards = standardAchievements.filter(
    (ach) => !onlyShowUnlocked || unlocked.some((u) => u.achievement_id === ach.id)
  );

  const displayedDynamics = dynamicGoalAchievements.filter(
    (ach) => !onlyShowUnlocked || ach.isUnlocked
  );

  if (displayedStandards.length === 0 && displayedDynamics.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs italic">
        Aucun succès débloqué pour le moment... 🐢
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Succès Standards */}
      {displayedStandards.map((ach) => {
        const isUnlocked = ach.id && unlocked.some((u) => u.achievement_id === ach.id);
        return (
          <div
            key={ach.id}
            className={`p-4 rounded-2xl border transition-all ${
              isUnlocked
                ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20'
                : 'bg-slate-50 border-slate-100 dark:bg-slate-800 opacity-60'
            }`}
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
      {displayedDynamics.map((ach) => (
        <div
          key={ach.id}
          className={`p-4 rounded-2xl border transition-all ${
            ach.isUnlocked
              ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20'
              : 'bg-slate-50 border-slate-100 dark:bg-slate-800 opacity-60'
          }`}
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
