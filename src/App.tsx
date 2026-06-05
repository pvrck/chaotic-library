import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Auth from '@/components/Auth';
import AddBookForm from '@/components/AddBookForm';
import BookList from '@/components/BookList'; // <-- Ajoute cet import
import { LogOut, Loader2 } from 'lucide-react';

export default function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // <-- Le trigger magique

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleBookAdded = () => {
    setRefreshTrigger((prev) => prev + 1); // Force la liste à reload
  };

  const handleBookStatusChanged = (nextStatus: string) => {
    if (nextStatus === 'Lu') {
      // 🎉 C'est ici qu'on branchera l'algo des Défis du Chaos à la prochaine étape !
      console.log('Un livre a été terminé ! Lancement potentiel du désordre...');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white p-4 md:p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📚 Chaotic Library</h1>
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
      </main>
    </div>
  );
}
