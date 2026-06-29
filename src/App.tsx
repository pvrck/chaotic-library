import { useAuth } from '@/context/AuthContext';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from '@/components/Layouts/AdminLayout';
import Layout from '@/components/Layouts/Layout';
import * as route from '@/constants/routes';
import { AdministrationChallengePage } from '@/pages/Administration/AdministrationChallengePage';
import { AdministrationChangeLogPage } from '@/pages/Administration/AdministrationChangeLogPage';
import { BooksPage } from '@/pages/BooksPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { Loader2 } from 'lucide-react';
import { AdminRouteGuard } from './components/Auth/AdminRouteGuard';
import { AdminAchievementsPage } from './pages/Administration/AdminAchievementsPage';
import { AdministrationLevelsPage } from './pages/Administration/AdministrationLevelsPage';
import { AdministrationUsersPage } from './pages/Administration/AdministrationUsersPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { CommunityPage } from './pages/CommunityPage';
import SagasPage from './pages/SagasPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { XpHistoryPage } from './pages/XpHistoryPage';

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
          <Route path={route.CHANGELOG} element={<ChangelogPage />} />
          <Route path={route.HISTORIC_XP} element={<XpHistoryPage />} />
          <Route path={route.COMMUNITY} element={<CommunityPage />} />
          <Route path={route.SAGAS} element={<SagasPage />} />
          <Route path={route.COMMUNITY_USER} element={<UserProfilePage />} />
        </Route>

        <Route element={<AdminRouteGuard />}>
          <Route path={route.ADMIN} element={<AdminLayout />}>
            <Route path={route.ADMIN_CHALLENGE} element={<AdministrationChallengePage />} />
            <Route path={route.ADMIN_CHANGELOG} element={<AdministrationChangeLogPage />} />
            <Route path={route.ADMIN_LEVELS} element={<AdministrationLevelsPage />} />
            <Route path={route.ADMIN_UTILISATEURS} element={<AdministrationUsersPage />} />
            <Route path={route.ADMIN_SUCCES} element={<AdminAchievementsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
