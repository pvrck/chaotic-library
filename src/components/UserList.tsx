import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';
import { formatDate } from '@/utils/date';
import { Search, Loader2, Trophy, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';

type UserSortOption = 'xp_desc' | 'username_asc' | 'created_desc' | 'created_asc';

export default function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres, recherche, tris & pagination
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<UserSortOption>('xp_desc'); // Tri par défaut : le classement par XP
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Format grille, 12 c'est top pour les multiples (2, 3, 4 colonnes)

  // Fonction pour calculer le niveau en fonction de l'XP
  // Exemple simple : 1 niveau tous les 500 XP (à adapter selon ta formule de jeu !)
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // On récupère les profils depuis Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, created_at');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // --- TRAITEMENT DES DONNÉES (FILTRE & TRI) ---
  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch = user.username?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'xp_desc') return b.xp - a.xp; // Plus de XP en premier (Classement)
      if (sortBy === 'username_asc') return (a.username || '').localeCompare(b.username || '');
      if (sortBy === 'created_desc')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Plus récents
      if (sortBy === 'created_asc')
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // Plus anciens
      return 0;
    });

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 🔍 BARRE DE RECHERCHE ET TRIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un aventurier par son pseudo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
          />
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as UserSortOption);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="xp_desc">🏆 Classement (Plus d'XP)</option>
            <option value="username_asc">🔤 Pseudo (A-Z)</option>
            <option value="created_desc">✨ Les derniers inscrits</option>
            <option value="created_asc">⏳ Les plus anciens membres</option>
          </select>
        </div>
      </div>

      {/* 👥 GRILLE DES UTILISATEURS */}
      {currentItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          Aucun utilisateur ne correspond à ce pseudo... 🔍
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentItems.map((user, index) => {
            const globalIndex = indexOfFirstItem + index + 1; // Position réelle dans le classement général

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 flex flex-col items-center text-center relative group hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer overflow-hidden"
              >
                {/* Petit badge de classement si trié par XP */}
                {sortBy === 'xp_desc' && (
                  <span
                    className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      globalIndex === 1
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : globalIndex === 2
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          : globalIndex === 3
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                            : 'bg-slate-50 text-slate-400 dark:bg-slate-900/60'
                    }`}
                  >
                    #{globalIndex}
                  </span>
                )}

                {/* Avatar */}
                <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-3 relative group-hover:border-indigo-500 transition-colors">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-indigo-400 dark:text-slate-500" />
                  )}
                </div>

                {/* Pseudo */}
                <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-xs line-clamp-1">
                  {user.username || 'Inconnu'}
                </h4>

                {/* Niveau */}
                <span className="mt-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">
                  Niveau {calculateLevel(user.xp)}
                </span>

                {/* Stats (XP & Ancienneté) */}
                <div className="w-full grid grid-cols-2 gap-1 border-t border-slate-50 dark:border-slate-700/30 mt-4 pt-3 text-[11px] text-slate-500">
                  <div className="flex flex-col items-center justify-center border-r border-slate-50 dark:border-slate-700/30">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      <Trophy className="h-3 w-3 text-amber-500 shrink-0" /> {user.xp}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">XP</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-0.5 text-[10px]">
                      <Calendar className="h-3 w-3 text-slate-400 shrink-0" />{' '}
                      {formatDate(user.created_at)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Membre</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🎛️ CONTROLES PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
          <span className="text-xs text-slate-500">
            Page {currentPage} sur {totalPages} ({filteredAndSortedUsers.length} membres)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
