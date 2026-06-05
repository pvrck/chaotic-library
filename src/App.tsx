import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { Session } from '@supabase/supabase-js';
import GameDashboard from '@/components/GameDashboard';
import BookList from '@/components/BookList';
import AdminChallengePool from '@/components/AdminChallengePool';
import {
  Loader2,
  BookOpen,
  LayoutDashboard,
  Library,
  PlusCircle,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import BookForm from '@/components/BookForm';
import Auth from '@/components/Auth';
import ProfileSettings from './components/ProfileSettings';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation par onglets étendue et plus précise
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pal' | 'add-book' | 'profile' | 'admin'
  >('dashboard');

  // Déclencheur pour synchroniser l'ajout de livres et la liste
  const [refreshBooksTrigger, setRefreshBooksTrigger] = useState(0);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      setProfile({ ...data });
    } catch (error) {
      console.error('Erreur lors du chargement du profil :', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 🔮 NAVIGATION BAR (ACCESSIBLE & TEXTUELLE) */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-50 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-1.5 rounded-lg">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-black tracking-wider uppercase hidden md:block">
              Chaotic Library
            </span>
          </div>

          {/* Onglets complets (Texte + Icône pour l'accessibilité) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              <span>Tableau de bord</span>
            </button>

            <button
              onClick={() => setActiveTab('pal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'pal'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Library className="h-3.5 w-3.5 shrink-0" />
              <span>Ma Bibliothèque</span>
            </button>

            <button
              onClick={() => setActiveTab('add-book')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'add-book'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Ajouter un livre</span>
            </button>

            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : ' cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Administration</span>
              </button>
            )}
          </div>

          {/* Profil */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`cursor-pointer text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Mon Profil"
            >
              {/* L'émoji ou l'avatar est toujours visible */}
              <span className="text-sm select-none">{profile?.avatar_url || '📖'}</span>

              {/* Le texte du pseudo se cache sur mobile et s'affiche à partir de 'sm' (tablette/desktop) */}
              <span className="truncate max-w-[90px] md:max-w-[140px] hidden sm:inline">
                {profile?.username || profile?.email?.split('@')[0] || 'Lectrice'}
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
              aria-label="Se déconnecter"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 🎮 CONTENU DYNAMIQUE DE L'ONGLET ACTIF */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 my-4 transition-all">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-200">
            <GameDashboard profile={profile} onXpChanged={() => fetchProfile(session.user.id)} />
          </div>
        )}

        {activeTab === 'pal' && (
          <div className="animate-in fade-in duration-200">
            {/* Juste la liste des livres, bien aérée */}
            <BookList
              refreshTrigger={refreshBooksTrigger}
              onBookStatusChanged={() => {
                if (session?.user) fetchProfile(session.user.id);
              }}
            />
          </div>
        )}

        {activeTab === 'add-book' && (
          <div className="animate-in fade-in duration-200 max-w-xl mx-auto">
            {/* Le formulaire tout seul dans son espace dédié */}
            <BookForm
              onBookAdded={() => {
                setRefreshBooksTrigger((prev) => prev + 1);
                setActiveTab('pal'); // Redirection auto vers la PAL après ajout, plus fluide !
              }}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-200">
            <ProfileSettings
              profile={profile}
              onProfileUpdate={() => {
                if (session?.user) fetchProfile(session.user.id);
              }}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-200">
            <AdminChallengePool currentProfile={profile} />
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-900 mt-auto">
        Chaotic Library © 2026 • Que le sort des dés te soit favorable.
      </footer>
    </div>
  );
}
