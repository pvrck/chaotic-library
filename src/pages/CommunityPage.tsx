import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserBadge } from '@/components/Community/UserBadge';
import { Link } from 'react-router-dom';
import { CommunityUser } from '@/types/users.type';
import { Eye, EyeOff, Users, Search } from 'lucide-react';
import * as route from '@/constants/routes';

export const CommunityPage = () => {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ États pour le tri, le filtrage et la recherche
  const [sortBy, setSortBy] = useState<'xp' | 'username' | 'registration_date' | 'last_activity'>(
    'xp'
  );
  const [showPrivate, setShowPrivate] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchFullCommunity = async () => {
      setLoading(true);
      try {
        // 🌟 Ici on charge TOUS les membres (pas de .limit(3) !), avec tous les champs nécessaires
        const { data, error } = await supabase.from('community_users_list').select('*');

        if (error) throw error;

        const validatedUsers: CommunityUser[] = (data || [])
          .filter((user): user is typeof user & { id: string } => user.id !== null)
          .map((user) => ({
            id: user.id,
            username: user.username || 'Lecteur Mystère',
            avatar_url: user.avatar_url || '',
            xp: user.xp || 0,
            is_private: user.is_private || false,
            registration_date: user.registration_date!,
            last_activity: user.last_activity,
          }));

        setUsers(validatedUsers);
      } catch (err) {
        console.error('Erreur lors de la récupération de la communauté :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullCommunity();
  }, []);

  // ⚙️ Logique de filtrage, recherche et tri combinée
  const filteredAndSortedUsers = users
    .filter((user) => {
      // 1. Filtre profil privé
      if (!showPrivate && user.is_private) return false;

      // 2. Filtre recherche par pseudo (ignore la casse)
      if (searchQuery.trim() !== '') {
        const usernameNormalized = (user.username || '').toLowerCase();
        const searchNormalized = searchQuery.toLowerCase().trim();
        if (!usernameNormalized.includes(searchNormalized)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'xp') return b.xp - a.xp;

      if (sortBy === 'username') {
        return (a.username || '').localeCompare(b.username || '');
      }

      if (sortBy === 'registration_date') {
        return new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime();
      }

      if (sortBy === 'last_activity') {
        const dateA = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        const dateB = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return dateB - dateA;
      }

      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-xs font-bold text-slate-400">
        Chargement de la guilde...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" /> Communauté
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Découvrez les autres lecteurs de la plateforme
          </p>
        </div>

        {/* 🛠️ ZONE DES FILTRES & BARRE DE RECHERCHE */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 text-xs w-full xl:w-auto">
          {/* LA BARRE DE RECHERCHE */}
          <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TOGGLE FILTRE PRIVÉ */}
            <button
              type="button"
              onClick={() => setShowPrivate(!showPrivate)}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                showPrivate
                  ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
              }`}
              title={showPrivate ? 'Masquer les profils privés' : 'Afficher les profils privés'}
            >
              {showPrivate ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">Profils privés</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* BOUTONS DE TRI */}
            <button
              type="button"
              onClick={() => setSortBy('xp')}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'xp' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              XP
            </button>
            <button
              type="button"
              onClick={() => setSortBy('username')}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'username' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              Pseudo
            </button>
            <button
              type="button"
              onClick={() => setSortBy('registration_date')}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'registration_date' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              Inscrit
            </button>
            <button
              type="button"
              onClick={() => setSortBy('last_activity')}
              className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'last_activity' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              Activité
            </button>
          </div>
        </div>
      </div>

      {/* 🗂️ GRILLE DE LA COMMUNAUTÉ */}
      {filteredAndSortedUsers.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          Aucun aventurier ne correspond à vos critères de recherche. 👁️
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredAndSortedUsers.map((user) => {
            if (user.is_private) {
              return <UserBadge key={user.id} user={user} variant="card" />;
            }

            return (
              <Link
                to={route.COMMUNITY_USER.replace(':userId', user.id)}
                key={user.id}
                className="block no-underline h-full"
              >
                <UserBadge user={user} variant="card" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
