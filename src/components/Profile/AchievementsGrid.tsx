import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy } from 'lucide-react';
import { Achievement } from '@/types/achievement.type';

export const AchievementsGrid = ({ userId }: { userId: string | undefined }) => {
  const [all, setAll] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      const { data: defs } = await supabase.from('achievements_definitions').select('*');
      const { data: userAch } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (defs) setAll(defs);
      if (userAch) setUnlocked(userAch.map((a) => a.achievement_id));
    };
    fetch();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {all.map((ach) => (
        <div
          key={ach.id}
          className={`p-4 rounded-2xl border ${ach.id && unlocked.includes(ach.id) ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 opacity-60'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${ach.id && unlocked.includes(ach.id) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
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
