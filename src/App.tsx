import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Profile } from '@/types';
import GameDashboard from '@/components/GameDashboard';
import BookList from '@/components/BookList';
import AdminChallengePool from '@/components/AdminChallengePool';
import { Loader2, BookOpen } from 'lucide-react';
import AddBookForm from './components/AddBookForm';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Petit déclencheur pour synchroniser l'ajout de livres et la liste
  const [refreshBooksTrigger, setRefreshBooksTrigger] = useState(0);

  // 1. Fonction pour charger (ou recharger) le profil joueur
  const fetchProfile = async (userId: string) => {
    try {
      // On ajoute un sélecteur de colonnes explicite pour forcer une nouvelle requête fraîche
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;

      // On force un nouvel objet pour que React comprenne que le profil a changé
      setProfile({ ...data });
    } catch (error) {
      console.error('Erreur lors du chargement du profil :', error);
    }
  };

  // 2. Gestion de la session utilisateur au démarrage
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

  // Simulation d'une connexion automatique si tu n'as pas encore fait de page de Login
  // (À retirer quand tu mettras un vrai système de login !)
  const handleFakeLogin = async () => {
    alert("Assure-toi d'avoir un utilisateur dans ta base Supabase !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Si pas connecté, tu peux afficher un bouton ou ton composant d'auth si tu en as un
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold mb-4">Chaotic Library 📚🎲</h1>
        <p className="text-sm text-slate-500 mb-4 text-center max-w-xs">
          Connecte-toi à ton tableau de bord pour lancer tes dés du destin.
        </p>
        <button
          onClick={handleFakeLogin}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-10">
      {/* HEADER DE LA PAGE (PROVISOIRE) */}
      {/* HEADER DE LA PAGE (PROVISOIRE) */}
      <header className="max-w-4xl mx-auto flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-600" /> CHAOTIC LIBRARY
        </h1>
        <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
          🧙‍♂️ {profile?.username || profile?.email || 'Lectrice Anonyme'}{' '}
          {/* 👈 Choix intelligent ici ! */}
        </span>
      </header>

      {/* 🎰 LE TABLEAU DE BORD DE JEU */}
      {/* On lui passe le profil ET la fonction magique de rafraîchissement */}
      <GameDashboard profile={profile} onXpChanged={() => fetchProfile(session.user.id)} />

      <hr className="max-w-4xl mx-auto border-slate-200 dark:border-slate-800" />

      {/* ZONE DES LIVRES */}
      <div className="space-y-4">
        <AddBookForm onBookAdded={() => setRefreshBooksTrigger((prev) => prev + 1)} />
        <BookList
          refreshTrigger={refreshBooksTrigger}
          onBookStatusChanged={() => {
            if (session?.user) fetchProfile(session.user.id);
          }}
        />
      </div>

      <hr className="max-w-4xl mx-auto border-slate-200 dark:border-slate-800" />

      {/* ZONE ADMIN */}
      <AdminChallengePool />
    </div>
  );
}
