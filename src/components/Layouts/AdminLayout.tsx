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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-8 text-indigo-400">Panel Admin</h1>
        <nav className="space-y-4 flex-grow">
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
        </nav>

        <div className="border-t border-gray-700 pt-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-white">
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Zone de contenu */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* L'Outlet rendra ici ta page /admin/changelog */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
