import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import { LogOut, Loader2 } from 'lucide-react';

export default function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  // On laisse "any" ou on ne met rien pour éviter d'importer le type brisé
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Vérifie la session actuelle au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    // 2. Écoute les changements d'état (login, logout...)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white p-6">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">📚 Mon Tableau de Bord</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </header>

      <main className="max-w-6xl mx-auto text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
        <p className="text-xl text-slate-500">
          Connexion OK ! Prochaine étape : le module d'Ajout de livres ou le Chaos tracker.
        </p>
      </main>
    </div>
  );
}