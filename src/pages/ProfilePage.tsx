import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Key, Sparkles, User } from 'lucide-react';
import { AVAILABLE_AVATARS } from '@/constants/available_avatars';
import { AchievementsGrid } from '@/components/Profile/AchievementsGrid';

export const ProfilePage = () => {
  const { profile, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'achievements'>('achievements');

  const [username, setUsername] = useState(profile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || '📖');

  // États mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États de feedback
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_url: selectedAvatar,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Profil mis à jour avec succès ! ✨' });
      refreshProfile();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setStatusMsg({ type: 'error', text: errorMessage || 'Erreur lors de la mise à jour.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Votre mot de passe a été modifié ! 🔐' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setStatusMsg({ type: 'error', text: errorMessage || 'Erreur mot de passe.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'achievements' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
          >
            Mes Succès
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
          >
            Mon Profil
          </button>
        </div>

        {activeTab === 'achievements' ? (
          <AchievementsGrid userId={profile?.id} />
        ) : (
          <div className="space-y-6">
            {/* 💳 CARTE D'AVENTURIÈRE */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xs flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-3xl shadow-inner">
                {selectedAvatar}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white">
                    {profile?.username || 'Aventurière'}
                  </h3>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-500">
                    {profile?.role || 'user'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{profile?.email}</p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 justify-center sm:justify-start">
                  <Sparkles className="h-3 w-3" /> Niveau{' '}
                  {Math.floor((profile?.xp || 0) / 1000) + 1} ({profile?.xp || 0} XP)
                </p>
              </div>
            </div>

            {statusMsg && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* FORMULAIRE INFOS DE BASE */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" /> Identité visuelle
                </h4>

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label
                      className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                      htmlFor="user-name"
                    >
                      Nom dans la guilde (Pseudo)
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Choisir un blason d'avatar
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_AVATARS.map((av) => (
                        <button
                          key={av.label}
                          type="button"
                          onClick={() => setSelectedAvatar(av.emoji)}
                          className={`p-3 rounded-xl text-xl transition-all cursor-pointer border ${
                            selectedAvatar === av.emoji
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 scale-105'
                              : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-slate-100'
                          }`}
                          title={av.label}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition-all"
                  >
                    Enregistrer les changements
                  </button>
                </form>
              </div>

              {/* FORMULAIRE SÉCURITÉ / MOT DE PASSE */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-indigo-500" /> Coffre-fort (Mot de passe)
                </h4>

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label
                      className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                      htmlFor="user-new-password"
                    >
                      Nouveau mot de passe
                    </label>
                    <input
                      id="user-new-password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                      htmlFor="user-new-password-bis"
                    >
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="user-new-password-bis"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 rounded-xl transition-all"
                  >
                    Modifier le mot de passe
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
