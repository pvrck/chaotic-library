import { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Book, BookOpen, LayoutDashboard, LogOut, ShieldAlert, Menu, X } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fermer le menu burger dès qu'on change de page
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMenuOpen(false);
    });

    return () => cancelAnimationFrame(handle);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses =
      'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full';
    const activeClasses = 'bg-indigo-600 text-white shadow-md';
    const inactiveClasses =
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row md:overflow-hidden">
      {/* 📱 HEADER MOBILE (Visible uniquement sur mobile) */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="font-black text-indigo-600 dark:text-indigo-400 tracking-wider text-sm uppercase flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Chaotic Library
        </h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* 🧭 SIDEBAR / DRAWER COMPLÈTE */}
      <nav
        className={`
        fixed inset-0 top-[61px] z-40 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between transition-transform duration-300 transform
        md:relative md:top-0 md:transform-none md:w-64 md:h-full md:border-r border-slate-200 dark:border-slate-800 md:flex
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <div className="space-y-6">
          {/* Titre caché sur Mobile (déjà dans le header), visible sur Desktop */}
          <div className="px-2 hidden md:block">
            <h1 className="font-black text-indigo-600 dark:text-indigo-400 tracking-wider text-sm uppercase flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Chaotic Library
            </h1>
          </div>

          {/* Liens de navigation verticaux */}
          <div className="flex flex-col gap-2">
            <NavLink to="/" className={getLinkClass} end>
              <LayoutDashboard className="h-5 w-5 md:h-4 md:w-4" />
              <span>Tableau de bord</span>
            </NavLink>

            <NavLink to="/livres" className={getLinkClass}>
              <Book className="h-5 w-5 md:h-4 md:w-4" />
              <span>Ma Bibliothèque</span>
            </NavLink>

            <NavLink to="/administration" className={getLinkClass}>
              <ShieldAlert className="h-5 w-5 md:h-4 md:w-4" />
              <span>Administration</span>
            </NavLink>
          </div>
        </div>

        {/* Profil et Déconnexion en bas */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`
            }
          >
            <span className="text-lg select-none">{profile?.avatar_url || '📖'}</span>
            <span className="truncate">{profile?.username || 'Pénélope'}</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left w-full"
          >
            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </nav>

      {/* 📦 CONTENU DYNAMIQUE DE LA ROUTE */}
      <main className="flex-1 h-full p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
