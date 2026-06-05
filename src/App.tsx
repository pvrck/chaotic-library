import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types'; // <-- Import du type Profile
import Auth from '@/components/Auth';
import AddBookForm from '@/components/AddBookForm';
import BookList from '@/components/BookList';
import AdminChallengePool from '@/components/AdminChallengePool';
import { LogOut, Loader2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- State pour le profil
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction pour charger le profil de l'utilisateur connecté
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error('Impossible de récupérer le profil :', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleBookAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBookStatusChanged = (nextStatus: string) => {
    if (nextStatus === 'Lu') {
      console.warn('Un livre a été terminé ! Lancement potentiel du désordre...');
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white p-4 md:p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">📚 Chaotic Library</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-6 pb-12">
        <AddBookForm onBookAdded={handleBookAdded} />
        <BookList refreshTrigger={refreshTrigger} onBookStatusChanged={handleBookStatusChanged} />

        {/* 🔒 Sécurité à l'affichage : Seul l'admin voit le panneau de gestion des défis */}
        {isAdmin && <AdminChallengePool />}
      </main>
    </div>
  );
}
