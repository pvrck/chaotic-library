import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChallengePoolItem, Profile } from '@/types';
import { Shield, Dices, Users, Key, UserCheck, Loader2, Ban } from 'lucide-react';

type AdminTab = 'challenges' | 'users';

interface AdminChallengePoolProps {
  currentProfile: Profile | null;
}

export default function AdminChallengePool({ currentProfile }: AdminChallengePoolProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('challenges');
  const [loading, setLoading] = useState(true);

  // --- ÉTATS DÉFIS ---
  const [challenges, setChallenges] = useState<ChallengePoolItem[]>([]);
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<'Tous' | 'chaos' | 'mensuel'>(
    'Tous'
  );

  // Formulaire d'ajout de défi
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'chaos' | 'mensuel'>('chaos');
  const [newXpBonus, setNewXpBonus] = useState(100);
  const [newXpMalus, setNewXpMalus] = useState(20);
  const [newDuration, setNewDuration] = useState(7);

  // --- ÉTATS UTILISATEURS ---
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // Petit déclencheur pour rafraîchir les données sans fâcher le linter
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Effet de chargement de l'univers Admin
  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const { data: chalData } = await supabase.from('challenge_pool').select('*');
        const { data: userData } = await supabase.from('profiles').select('*');

        if (isMounted) {
          setChallenges(chalData || []);
          setUsers(userData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur admin load:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]); // Écoute le trigger pour recharger proprement

  // Soumission d'un nouveau défi
  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error: insertError } = await supabase.from('challenge_pool').insert([
        {
          title: newTitle,
          description: newDesc,
          type: newType,
          xp_bonus: newXpBonus,
          xp_malus: newXpMalus,
          duration_days: newType === 'mensuel' ? 30 : newDuration,
        },
      ]);
      if (insertError) throw insertError;

      setNewTitle('');
      setNewDesc('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du défi.');
    }
  };

  // Actions de modération utilisateur
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

  // --- FILTRAGE DES DONNÉES ---
  const filteredChallenges = challenges.filter(
    (c) => challengeTypeFilter === 'Tous' || c.type === challengeTypeFilter
  );

  const filteredUsers = users.filter(
    (u) =>
      (u.username || '').toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  if (!currentProfile || currentProfile.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">
          🛑 Accès Interdit. Vous devez être Grand Maître pour accéder à cette zone.
        </p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="w-full space-y-6">
      {/* 🧭 EN-TÊTE & MENU DE NAVIGATION ADMIN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-indigo-600" /> Bureau des Grands Maîtres
          </h2>
          <p className="text-[11px] text-slate-400">
            Contrôle le Chaos et veille sur la communauté.
          </p>
        </div>

        {/* Onglets internes Admin */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveAdminTab('challenges')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'challenges'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Dices className="h-3.5 w-3.5" />
            <span>Défis ({challenges.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Joueurs ({users.length})</span>
          </button>
        </div>
      </div>

      {/* 🎰 SECTION 1 : GESTION DES DÉFIS */}
      {activeAdminTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Formulaire de création */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forger un défi
            </h3>
            <form onSubmit={handleAddChallenge} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé du défi
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Lire un thriller sous la couette"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Contrainte
                </label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Précise les règles magiques..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Type de Sort
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'chaos' | 'mensuel')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none"
                  >
                    <option value="chaos">🔮 Chaos</option>
                    <option value="mensuel">📅 Mensuel</option>
                  </select>
                </div>
                {newType === 'chaos' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Durée (jours)
                    </label>
                    <input
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gain (XP)
                  </label>
                  <input
                    type="number"
                    value={newXpBonus}
                    onChange={(e) => setNewXpBonus(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Malus (XP)
                  </label>
                  <input
                    type="number"
                    value={newXpMalus}
                    onChange={(e) => setNewXpMalus(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-rose-600 font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 rounded-xl mt-2 transition-all"
              >
                Ajouter au Pool de l'Univers
              </button>
            </form>
          </div>

          {/* Liste filtrable du pool existant */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-xs overflow-x-auto">
              {(['Tous', 'chaos', 'mensuel'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChallengeTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer transition-colors ${
                    challengeTypeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'chaos'
                    ? '🔮 Défis du Chaos'
                    : t === 'mensuel'
                      ? '📅 Défis Mensuels'
                      : '✨ Tout afficher'}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
              {filteredChallenges.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Aucun défi de ce type enregistré.
                </div>
              ) : (
                filteredChallenges.map((c) => (
                  <div key={c.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.type === 'chaos' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {c.type.toUpperCase()}
                        </span>
                        <h4 className="font-bold text-slate-800 dark:text-white">{c.title}</h4>
                      </div>
                      <p className="text-slate-400 mt-1">{c.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ⏱️ {c.type === 'mensuel' ? 'Tout le mois' : `${c.duration_days} jours`} •{' '}
                        <span className="text-emerald-600">+{c.xp_bonus} XP</span> •{' '}
                        <span className="text-rose-500">-{c.xp_malus} XP</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🧙‍♂️ SECTION 2 : GESTION DES UTILISATRICES */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 max-w-sm">
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
              filteredUsers.map((u) => (
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
                      <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
                        ⭐ Niveau {Math.floor((u.xp || 0) / 1000) + 1} ({u.xp || 0} XP)
                      </p>
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
