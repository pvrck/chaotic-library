import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChallengePoolItem, Profile } from '@/types';
import {
  Shield,
  Dices,
  Users,
  Key,
  UserCheck,
  Loader2,
  Ban,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';

// --- NOTRE TYPE POUR LES NIVEAUX ---
interface LevelConfig {
  id: number;
  xp_min: number;
  title: string;
}

// --- LA MÉTHODE DE CALCUL DES NIVEAUX ---
function getPlayerLevelInfo(xp: number, levels: LevelConfig[]) {
  if (!levels || levels.length === 0) {
    return { title: 'Curieuse', nextLevelXp: null, progressPercentage: 0 };
  }

  // On trie les niveaux par XP croissants
  const sortedLevels = [...levels].sort((a, b) => a.xp_min - b.xp_min);

  let currentTitle = sortedLevels[0]?.title || 'Curieuse';
  let nextLevelXp: number | null = null;
  let currentLevelMinXp = 0;

  for (let i = 0; i < sortedLevels.length; i++) {
    if (xp >= sortedLevels[i].xp_min) {
      currentTitle = sortedLevels[i].title;
      currentLevelMinXp = sortedLevels[i].xp_min;
      nextLevelXp = sortedLevels[i + 1] ? sortedLevels[i + 1].xp_min : null;
    } else {
      break;
    }
  }

  let progressPercentage = 100;
  if (nextLevelXp !== null) {
    const range = nextLevelXp - currentLevelMinXp;
    const gainedInCurrentRange = xp - currentLevelMinXp;
    progressPercentage = range > 0 ? (gainedInCurrentRange / range) * 100 : 100;
  }

  return {
    title: currentTitle,
    nextLevelXp,
    progressPercentage: Math.min(100, Math.max(0, Math.round(progressPercentage))),
  };
}

type AdminTab = 'challenges' | 'users' | 'levels';

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

  // États pour l'édition d'un défi
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editXpBonus, setEditXpBonus] = useState(0);
  const [editXpMalus, setEditXpMalus] = useState(0);
  const [editDuration, setEditDuration] = useState(0);

  // --- ÉTATS UTILISATEURS ---
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // --- ÉTATS NIVEAUX (ADMINISTRABLES) ---
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [newLevelXp, setNewLevelXp] = useState<number>(0);
  const [newLevelTitle, setNewLevelTitle] = useState<string>('');
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [editLevelXp, setEditLevelXp] = useState<number>(0);
  const [editLevelTitle, setEditLevelTitle] = useState<string>('');

  // Petit déclencheur pour rafraîchir les données sans fâcher le linter
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Effet de chargement de l'univers Admin
  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const { data: chalData } = await supabase
          .from('challenge_pool')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: userData } = await supabase.from('profiles').select('*');

        const { data: levelData } = await supabase
          .from('levels_config')
          .select('*')
          .order('xp_min', { ascending: true });

        if (isMounted) {
          setChallenges(chalData || []);
          setUsers(userData || []);
          setLevels(levelData || []);
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
  }, [refreshTrigger]);

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

  // 🔥 ACTION : Activer le mode édition sur une ligne défi
  const startEditing = (challenge: ChallengePoolItem) => {
    setEditingId(challenge.id);
    setEditTitle(challenge.title);
    setEditDesc(challenge.description);
    setEditXpBonus(challenge.xp_bonus);
    setEditXpMalus(challenge.xp_malus);
    setEditDuration(challenge.duration_days || 7);
  };

  // 🔥 ACTION : Sauvegarder les modifications d'un défi
  const handleUpdateChallenge = async (id: string) => {
    const originalChallenge = challenges.find((c) => c.id === id);
    if (!originalChallenge) return;

    try {
      const { error: updateError } = await supabase
        .from('challenge_pool')
        .update({
          title: editTitle,
          description: editDesc,
          xp_bonus: editXpBonus,
          xp_malus: editXpMalus,
          duration_days: originalChallenge.type === 'mensuel' ? null : editDuration,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setEditingId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Erreur update complète:', err);
      const errorWithInterface = err as { message?: string; details?: string };
      alert(
        `Erreur lors de la modification : ${errorWithInterface.message || errorWithInterface.details || 'Erreur inconnue'}`
      );
    }
  };

  // 🗑️ ACTION : Supprimer un défi du pool
  const handleDeleteChallenge = async (id: string, title: string) => {
    if (confirm(`Es-tu sûr de vouloir anéantir le défi "${title}" de l'univers ?`)) {
      try {
        const { error: deleteError } = await supabase.from('challenge_pool').delete().eq('id', id);

        if (deleteError) throw deleteError;
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  // --- ACTIONS DES NIVEAUX ---
  const handleAddLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('levels_config')
        .insert([{ xp_min: newLevelXp, title: newLevelTitle }]);

      if (error) throw error;
      setNewLevelXp(0);
      setNewLevelTitle('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du palier. L'XP minimum doit être unique.");
    }
  };

  const startEditingLevel = (lvl: LevelConfig) => {
    setEditingLevelId(lvl.id);
    setEditLevelXp(lvl.xp_min);
    setEditLevelTitle(lvl.title);
  };

  const handleUpdateLevel = async (id: number) => {
    try {
      const { error } = await supabase
        .from('levels_config')
        .update({ xp_min: editLevelXp, title: editLevelTitle })
        .eq('id', id);

      if (error) throw error;
      setEditingLevelId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du palier.');
    }
  };

  const handleDeleteLevel = async (id: number, title: string) => {
    if (confirm(`Supprimer le rang "${title}" ?`)) {
      try {
        const { error } = await supabase.from('levels_config').delete().eq('id', id);
        if (error) throw error;
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression du palier.');
      }
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

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
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
          <button
            onClick={() => setActiveAdminTab('levels')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'levels'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Rangs ({levels.length})</span>
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
                  <div
                    key={c.id}
                    className="p-4 flex flex-col gap-2 text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/10"
                  >
                    {/* 🔄 MODE ÉDITION ACTIF SUR CE DÉFI */}
                    {editingId === c.id ? (
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 rounded-lg font-bold"
                          />
                          {c.type === 'chaos' && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="shrink-0 text-slate-400">Durée (j) :</span>
                              <input
                                type="number"
                                value={editDuration}
                                onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-center"
                              />
                            </div>
                          )}
                        </div>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                        />
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex gap-3 items-center">
                            <span className="text-emerald-600 font-bold">
                              +
                              <input
                                type="number"
                                value={editXpBonus}
                                onChange={(e) => setEditXpBonus(parseInt(e.target.value) || 0)}
                                className="w-12 px-1 bg-white dark:bg-slate-800 text-center rounded"
                              />{' '}
                              XP
                            </span>
                            <span className="text-rose-500 font-bold">
                              -
                              <input
                                type="number"
                                value={editXpMalus}
                                onChange={(e) => setEditXpMalus(parseInt(e.target.value) || 0)}
                                className="w-12 px-1 bg-white dark:bg-slate-800 text-center rounded"
                              />{' '}
                              XP
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateChallenge(c.id)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Valider"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                              title="Annuler"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 👁️ MODE VISUALISATION SIMPLE (PAR DÉFAUT) */
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.type === 'chaos' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}
                            >
                              {c.type.toUpperCase()}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white">{c.title}</h4>
                          </div>
                          <p className="text-slate-400">{c.description}</p>
                          <p className="text-[10px] text-slate-400">
                            ⏱️ {c.type === 'mensuel' ? 'Tout le mois' : `${c.duration_days} jours`}{' '}
                            •{' '}
                            <span className="text-emerald-600 font-semibold">+{c.xp_bonus} XP</span>{' '}
                            Presque •{' '}
                            <span className="text-rose-500 font-semibold">-{c.xp_malus} XP</span>
                          </p>
                        </div>

                        {/* Boutons d'action rapides */}
                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => startEditing(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Modifier le défi"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(c.id, c.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
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
        </div>
      )}

      {/* 📜 SECTION 3 : GESTION DES NIVEAUX / RANGS */}
      {activeAdminTab === 'levels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Formulaire de création de Palier */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forger un nouveau Rang
            </h3>
            <form onSubmit={handleAddLevel} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  XP Minimum requis
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newLevelXp}
                  onChange={(e) => setNewLevelXp(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du Titre Mystique
                </label>
                <input
                  type="text"
                  required
                  value={newLevelTitle}
                  onChange={(e) => setNewLevelTitle(e.target.value)}
                  placeholder="Ex: Bibliomancienne"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 rounded-xl mt-2 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Graver le Rang
              </button>
            </form>
          </div>

          {/* Tableau d'édition en direct des Rangs */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">XP Minimum</th>
                    <th className="py-3 px-4 font-bold">Titre de l'Univers</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {levels.map((lvl) => (
                    <tr
                      key={lvl.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors"
                    >
                      {editingLevelId === lvl.id ? (
                        <>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              value={editLevelXp}
                              onChange={(e) => setEditLevelXp(parseInt(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono font-bold text-indigo-600"
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={editLevelTitle}
                              onChange={(e) => setEditLevelTitle(e.target.value)}
                              className="w-full max-w-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg font-semibold"
                            />
                          </td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUpdateLevel(lvl.id)}
                                className="p-1 bg-emerald-600 text-white rounded-md cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingLevelId(null)}
                                className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {lvl.xp_min} XP
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                            ✨ {lvl.title}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-60 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingLevel(lvl)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer"
                                title="Modifier"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(lvl.id, lvl.title)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
