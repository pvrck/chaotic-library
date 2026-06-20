import { supabase } from '@/lib/supabaseClient';
import { ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Clock, User, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CommunityUser {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  registration_date: string;
  last_activity: string | null;
}

type SortField = 'username' | 'registration_date' | 'last_activity' | 'xp';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12; // 12 permet de faire de jolis grids (3x4 ou 2x6)

export const CommunityPage = () => {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('xp'); // Tri par XP par défaut pour valoriser les plus actifs !
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const doFetch = async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from('community_users_list')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      // On ne met à jour l'état que si le composant est toujours affiché
      if (isMounted && !error && data) {
        setUsers(data as CommunityUser[]);
        setTotalCount(count || 0);
        setLoading(false);
      }
    };

    doFetch();

    // Fonction de nettoyage (cleanup)
    return () => {
      isMounted = false;
    };
  }, [currentPage, sortField, sortOrder]);

  const handleSortChange = (field: SortField) => {
    setLoading(true);
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'username' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return 'Aucune activité';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Communauté</h2>
          <p className="text-sm text-slate-500">Découvrez les autres lecteurs de la plateforme</p>
        </div>

        {/* Boutons de Tri épurés pour les utilisateurs */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {(
            [
              { id: 'xp', label: 'XP' },
              { id: 'username', label: 'Pseudo' },
              { id: 'registration_date', label: 'Inscrit' },
              { id: 'last_activity', label: 'Activité' },
            ] as { id: SortField; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSortChange(tab.id)}
              className={`px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors ${
                sortField === tab.id
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
              {sortField === tab.id && <ArrowUpDown className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des profils sous forme de Grille / Cartes */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement des profils...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Aucun lecteur trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Avatar */}
              <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700 shadow-inner">
                {user.avatar_url && user.avatar_url.trim() !== '' ? (
                  // Si c'est un emoji, il s'affiche en grand ici
                  <span>{user.avatar_url}</span>
                ) : (
                  // Fallback si l'utilisateur n'a pas encore choisi d'avatar
                  <User className="h-6 w-6 text-slate-400" />
                )}
              </div>

              {/* Pseudo & XP */}
              <h4 className="mt-3 font-bold text-slate-800 dark:text-white truncate w-full px-2">
                {user.username || 'Lecteur Mystère'}
              </h4>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Zap className="h-3 w-3 fill-current" /> {user.xp.toLocaleString()} XP
              </span>

              {/* Ligne de séparation subtile */}
              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />

              {/* Dates */}
              <div className="w-full grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                <div className="flex flex-col items-center gap-0.5 border-r border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" /> Membre
                  </span>
                  <span className="text-slate-700 dark:text-slate-400 font-semibold">
                    {new Date(user.registration_date).toLocaleDateString('fr-FR', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" /> Activité
                  </span>
                  <span className="text-slate-700 dark:text-slate-400 font-semibold truncate max-w-full px-1">
                    {formatLastActivity(user.last_activity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
          <span>{totalCount} membres au total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => {
                setLoading(true);
                setCurrentPage((prev) => prev - 1);
              }}
              className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-40 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => {
                setLoading(true);
                setCurrentPage((prev) => prev + 1);
              }}
              className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-40 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
