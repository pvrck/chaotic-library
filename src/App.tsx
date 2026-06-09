import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import Layout from '@/components/Layouts/Layout';
import { Loader2 } from 'lucide-react';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BooksPage } from '@/pages/BooksPage';
import { ProfilePage } from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { AdminLayout } from '@/components/Layouts/AdminLayout';
import { AdministrationChangeLogPage } from '@/pages/Administration/AdministrationChangeLogPage';
import * as route from '@/constants/routes';
import { AdministrationChallengePage } from '@/pages/Administration/AdministrationChallengePage';
import { AdministrationLevelsPage } from './pages/Administration/AdministrationLevelsPage';
import { AdministrationUsersPage } from './pages/Administration/AdministrationUsersPage';
import { AdminRouteGuard } from './components/Auth/AdminRouteGuard';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={route.LOGIN}
          element={!session ? <LoginPage /> : <Navigate to="/" replace />}
        />

        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path={route.LIVRES} element={<BooksPage />} />
          <Route path={route.PROFIL} element={<ProfilePage />} />
        </Route>

        <Route element={<AdminRouteGuard />}>
          <Route path={route.ADMIN} element={<AdminLayout />}>
            <Route path={route.ADMIN_CHALLENGE} element={<AdministrationChallengePage />} />
            <Route path={route.ADMIN_CHANGELOG} element={<AdministrationChangeLogPage />} />
            <Route path={route.ADMIN_LEVELS} element={<AdministrationLevelsPage />} />
            <Route path={route.ADMIN_UTILISATEURS} element={<AdministrationUsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
