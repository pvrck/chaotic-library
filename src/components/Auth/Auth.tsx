import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, Loader2, User } from 'lucide-react';
import logo from '@/assets/chaotic-librairy-logo.png';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Inscription réussie ! Vérifie ta boîte mail pour valider ton compte.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setMessage({ type: 'error', text: errorMessage || 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <img src={logo} alt="" aria-hidden className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSignUp ? 'Créer un compte' : 'Chaotic Library'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isSignUp
              ? 'Rejoins le club de lecture'
              : 'Suivi de lecture pour les maniaques du livre'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {message && (
            <div
              className={`p-4 rounded-xl text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {isSignUp && (
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="user-username"
                >
                  Pseudo
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="user-username"
                    type="text"
                    required={isSignUp}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950 sm:text-sm"
                    placeholder="Ton pseudo unique"
                  />
                </div>
              </div>
            )}
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="user-email"
              >
                Adresse email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950 sm:text-sm"
                  placeholder="toi@exemple.com"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="user-password"
              >
                Mot de passe
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="user-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                "S'inscrire"
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {isSignUp ? 'Déjà un compte ? Connecte-toi' : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
