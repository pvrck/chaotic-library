import { Link, NavLink, Outlet } from 'react-router-dom';
import * as route from '@/constants/routes';

export const AdminLayout = () => {
  // Ici, plus tard, on ajoutera le check :
  // si !admin -> redirect vers "/"

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses =
      'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full';
    const activeClasses = 'bg-indigo-600 text-white shadow-md';
    const inactiveClasses =
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white p-4 md:p-6 flex flex-row md:flex-col shrink-0 overflow-x-auto md:h-full">
        <h1 className="text-xl font-bold mb-0 md:mb-8 text-indigo-400 hidden md:block">
          Panel Admin
        </h1>

        {/* Navigation : horizontale sur mobile, verticale sur desktop */}
        <nav className="flex flex-row md:flex-col gap-2 md:space-y-4 flex-grow overflow-x-auto">
          <NavLink to={route.ADMIN_CHANGELOG} className={getLinkClass}>
            Changelog
          </NavLink>
          <NavLink to={route.ADMIN_CHALLENGE} className={getLinkClass}>
            Défis
          </NavLink>
          <NavLink to={route.ADMIN_LEVELS} className={getLinkClass}>
            Rangs
          </NavLink>
          <NavLink to={route.ADMIN_UTILISATEURS} className={getLinkClass}>
            Utilisateurs
          </NavLink>
          <NavLink to={route.ADMIN_SUCCES} className={getLinkClass}>
            Succès
          </NavLink>
        </nav>

        {/* Retour site */}
        <div className="md:border-t border-gray-700 pl-4 md:pl-0 md:pt-4 ml-2 md:ml-0 flex items-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white whitespace-nowrap">
            ← Retour
          </Link>
        </div>
      </aside>

      {/* Zone de contenu */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
