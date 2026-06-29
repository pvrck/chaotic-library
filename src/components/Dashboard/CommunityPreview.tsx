import * as route from '@/constants/routes';
import { supabase } from '@/lib/supabaseClient';
import { PreviewUser } from '@/types/users.type';
import { Trophy, User, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const CommunityPreview = () => {
  const [topUsers, setTopUsers] = useState<PreviewUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('community_users_list')
          .select('id, username, avatar_url, xp')
          .order('xp', { ascending: false })
          .limit(3);

        if (error) throw error;

        // 🌟 On filtre pour s'assurer que l'id, le pseudo et l'XP existent bien
        // et on force le type pour correspondre parfaitement à PreviewUser[]
        const validatedUsers: PreviewUser[] = (data || [])
          .filter(
            (user): user is typeof user & { id: string; xp: number } =>
              user.id !== null && user.xp !== null
          )
          .map((user) => ({
            id: user.id,
            username: user.username || 'Lecteur Mystère',
            avatar_url: user.avatar_url || '',
            xp: user.xp,
          }));

        setTopUsers(validatedUsers);
      } catch (err) {
        console.error('Erreur preview communauté :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col h-full">
      {/* Entête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top de la guilde
        </h3>
        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold animate-pulse">
          Live
        </span>
      </div>

      {/* Liste des top joueurs */}
      <div className="space-y-3 flex-1">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-400">Calcul du podium...</div>
        ) : (
          topUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Numéro de rang ou Médaille */}
                <span className="text-xs font-black w-4 text-center text-slate-400">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>

                {/* Mini Avatar */}
                <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-lg border border-slate-100 dark:border-slate-700 shrink-0">
                  {user.avatar_url && user.avatar_url.trim() !== '' ? (
                    <span>{user.avatar_url}</span>
                  ) : (
                    <User className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Pseudo */}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                  {user.username || 'Lecteur Mystère'}
                </span>
              </div>

              {/* Score XP */}
              <span className="inline-flex items-center gap-0.5 text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded-lg shrink-0">
                <Zap className="h-3 w-3 fill-current text-amber-400 border-none" />{' '}
                {user.xp.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <Link
        to={route.COMMUNITY}
        className="w-full mt-4 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-700/30 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Trophy className="h-3.5 w-3.5" /> Voir le classement complet
      </Link>
    </div>
  );
};
