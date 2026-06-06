import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Book, BookOpen, LayoutDashboard, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login'); // Redirection automatique après déconnexion
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses =
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors shrink-0';

    const activeClasses = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';

    const inactiveClasses =
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';

    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 dark:bg-slate-940 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row md:overflow-hidden">
      {/* 🧭 BARRE DE NAVIGATION (Accessible & Sémantique avec <nav>) */}
      <nav className="w-full md:w-64 md:h-full bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 space-y-6 flex flex-col justify-between shrink-0 overflow-y-auto md:overflow-y-visible">
        <div className="space-y-6">
          {/* Titre / Logo */}
          <div className="px-2">
            <h1 className="font-black text-indigo-600 dark:text-indigo-400 tracking-wider text-sm uppercase flex items-center gap-2 ">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Chaotic Library
            </h1>
          </div>

          {/* Liens de navigation avec <Link> au lieu de boutons */}
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            <NavLink to="/" className={getLinkClass} end>
              <LayoutDashboard className="h-4 w-4" />
              <span>Tableau de bord</span>
            </NavLink>

            <NavLink to="/livres" className={getLinkClass}>
              <Book className="h-4 w-4" />
              <span>Ma Bibliothèque</span>
            </NavLink>

            <NavLink to="/administration" className={getLinkClass}>
              <ShieldAlert className="h-4 w-4" />
              <span>Administration</span>
            </NavLink>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 pt-2 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:space-y-2">
          {/* Version NavLink de ton bouton magique ✨ */}
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `cursor-pointer text-[11px] font-bold px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-all w-full min-w-[50px] sm:min-w-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
            title="Mon Profil"
          >
            {/* L'émoji ou l'avatar */}
            <span className="text-sm select-none shrink-0">{profile?.avatar_url || '📖'}</span>

            {/* Le texte du pseudo (caché sur micro-mobile, visible dès 'sm') */}
            <span className="truncate max-w-[90px] md:max-w-[140px] hidden sm:inline">
              {profile?.username || 'Lectrice'}
            </span>
          </NavLink>

          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left w-full md:mt-auto shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline md:inline">Se déconnecter</span>
          </button>
        </div>
      </nav>

      {/* 📦 CONTENU DYNAMIQUE DE LA ROUTE */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
