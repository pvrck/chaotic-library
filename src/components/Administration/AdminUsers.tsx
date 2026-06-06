import { useState } from 'react';
import { Profile } from '@/types/users.type';
import { supabase } from '@/lib/supabaseClient';
import { Ban, Key, UserCheck } from 'lucide-react';
import { getPlayerLevelInfo } from '@/lib/levelUtils';
import { Level } from '@/types/levels.type';

interface AdminUsersProps {
  users: Profile[];
  levels: Level[];
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminUsers = ({ users, levels, setRefreshTrigger }: AdminUsersProps) => {
  const [searchUser, setSearchUser] = useState('');

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', userId);
      if (updateError) throw updateError;
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Impossible de modifier le rôle.');
    }
  };

  const handleResetPassword = (email: string | undefined) => {
    if (!email) return;
    alert(`Lien de réinitialisation de mot de passe simulé pour : ${email}`);
  };

  const handleModerateProfile = async (userId: string) => {
    if (confirm('Rétablir le pseudo par défaut pour cause de non-respect de la charte ?')) {
      try {
        const { error: modError } = await supabase
          .from('profiles')
          .update({ username: 'Lectrice_Modérée' })
          .eq('id', userId);
        if (modError) throw modError;
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error(err);
        alert('Erreur de modération.');
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.username || '').toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 ">
        <input
          type="text"
          placeholder="Rechercher par pseudo ou email..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs text-slate-800 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40 shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Aucune lectrice ne correspond à ce nom.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const { title, nextLevelXp, progressPercentage } = getPlayerLevelInfo(
              u.xp || 0,
              levels
            );
            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-indigo-600 text-sm">
                    {(u.username || 'L')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-800 dark:text-white">
                        {u.username || 'Lectrice Sans Nom'}
                      </h4>
                      {u.role === 'admin' && (
                        <span className="text-[9px] bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-1.5 py-0.2 rounded-md font-black uppercase tracking-wider">
                          GM Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {u.email || 'Pas de mail rattaché'}
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1.5">
                        ✨ {title}{' '}
                        <span className="text-slate-400 font-medium">({u.xp || 0} XP)</span>
                      </p>
                      {nextLevelXp && (
                        <div className="w-32 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                  <button
                    onClick={() => handleModerateProfile(u.id)}
                    className="cursor-pointer flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-xl border border-amber-200 transition-all font-medium"
                    title="Nettoyer le profil"
                  >
                    <Ban className="h-3 w-3" /> Modérer
                  </button>

                  <button
                    onClick={() => handleResetPassword(u.email)}
                    className="cursor-pointer flex items-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all font-medium"
                    title="Forcer reset pass"
                  >
                    <Key className="h-3 w-3" /> Clé/Pass
                  </button>

                  <button
                    onClick={() => handleToggleAdmin(u.id, u.role || 'user')}
                    className={`cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                      u.role === 'admin'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <UserCheck className="h-3 w-3" />{' '}
                    {u.role === 'admin' ? 'Destituer' : 'Promouvoir'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};
