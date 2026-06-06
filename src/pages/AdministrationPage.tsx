import { useAuth } from '@/context/AuthContext';
import { AdminTab, EAdminTab } from '@/types/admin.type';
import { ChallengePoolItem } from '@/types/challenges.type';
import { Level } from '@/types/levels.type';
import { Profile } from '@/types/users.type';
import { Dices, Loader2, Shield, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AdminChallenge } from '@/components/Administration/AdminChallenge';
import { AdminUsers } from '@/components/Administration/AdminUsers';
import { AdminLevels } from '@/components/Administration/AdminLevels';

export const AdministrationPage = () => {
  const { profile } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(EAdminTab.Challenges);
  const [loading, setLoading] = useState(true);

  const [challenges, setChallenges] = useState<ChallengePoolItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const { data: chalData } = await supabase
          .from('challenge_pool')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: userData } = await supabase.from('profiles').select('*');

        const { data: levelData } = await supabase
          .from('levels_config')
          .select('*')
          .order('xp_min', { ascending: true });

        if (isMounted) {
          setChallenges(chalData || []);
          setUsers(userData || []);
          setLevels(levelData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur admin load:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">
          🛑 Accès Interdit. Vous devez être Grand Maître pour accéder à cette zone.
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs mb-6">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-indigo-600" /> Bureau des Grands Maîtres
          </h2>
          <p className="text-[11px] text-slate-400">
            Contrôle le Chaos et veille sur la communauté.
          </p>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab(EAdminTab.Challenges)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === EAdminTab.Challenges
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Dices className="h-3.5 w-3.5" />
            <span>Défis ({challenges.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab(EAdminTab.Users)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === EAdminTab.Users
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Joueurs ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab(EAdminTab.Levels)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === EAdminTab.Levels
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Rangs ({levels.length})</span>
          </button>
        </div>
      </div>

      {activeAdminTab === EAdminTab.Challenges && (
        <AdminChallenge challenges={challenges} setRefreshTrigger={setRefreshTrigger} />
      )}
      {activeAdminTab === EAdminTab.Users && (
        <AdminUsers users={users} levels={levels} setRefreshTrigger={setRefreshTrigger} />
      )}
      {activeAdminTab === EAdminTab.Levels && (
        <AdminLevels levels={levels} setRefreshTrigger={setRefreshTrigger} />
      )}
    </div>
  );
};
