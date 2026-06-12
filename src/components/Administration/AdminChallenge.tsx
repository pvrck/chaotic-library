import { EChallengeType } from '@/types/challenges.type';
import { useState } from 'react';
import { ChallengePoolItem } from '@/types/challenges.type';
import { supabase } from '@/lib/supabaseClient';
import { Check, Edit2, Trash2, X } from 'lucide-react';

interface AdminChallengeProps {
  challenges: ChallengePoolItem[];
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminChallenge = ({ challenges, setRefreshTrigger }: AdminChallengeProps) => {
  const [challengeTypeFilter, setChallengeTypeFilter] = useState<'Tous' | EChallengeType>('Tous');

  // Formulaire d'ajout de défi
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<EChallengeType>(EChallengeType.Chaos);
  const [newXpBonus, setNewXpBonus] = useState(100);
  const [newXpMalus, setNewXpMalus] = useState(20);
  const [newDuration, setNewDuration] = useState(7);

  // États pour l'édition d'un défi
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState<string | null>(null);
  const [editXpBonus, setEditXpBonus] = useState(0);
  const [editXpMalus, setEditXpMalus] = useState(0);
  const [editDuration, setEditDuration] = useState(0);

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
          duration_days: newType === EChallengeType.Mensuel ? 30 : newDuration,
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
          duration_days: originalChallenge.type === EChallengeType.Mensuel ? null : editDuration,
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

  const filteredChallenges = challenges.filter(
    (c) => challengeTypeFilter === 'Tous' || c.type === challengeTypeFilter
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Formulaire de création */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Forger un défi
        </h3>
        <form onSubmit={handleAddChallenge} className="space-y-3 text-xs">
          <div>
            <label
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              htmlFor="challenge-title"
            >
              Intitulé du défi
            </label>
            <input
              id="challenge-title"
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Lire un thriller sous la couette"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              htmlFor="challenge-desc"
            >
              Description / Contrainte
            </label>
            <textarea
              id="challenge-desc"
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
                onChange={(e) => setNewType(e.target.value as EChallengeType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none"
              >
                <option value={EChallengeType.Chaos}>🔮 {EChallengeType.Chaos}</option>
                <option value={EChallengeType.Mensuel}>📅 {EChallengeType.Mensuel}</option>
              </select>
            </div>
            {newType === EChallengeType.Chaos && (
              <div>
                <label
                  className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                  htmlFor="challenge-duration"
                >
                  Durée (jours)
                </label>
                <input
                  id="challenge-duration"
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
              <label
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="challenge-bonus-xp"
              >
                Gain (XP)
              </label>
              <input
                id="challenge-bonus-xp"
                type="number"
                value={newXpBonus}
                onChange={(e) => setNewXpBonus(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-emerald-600 font-bold"
              />
            </div>
            <div>
              <label
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="challenge-malus-xp"
              >
                Malus (XP)
              </label>
              <input
                id="challenge-malus-xp"
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
          {(['Tous', EChallengeType.Chaos, EChallengeType.Mensuel] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChallengeTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer transition-colors ${
                challengeTypeFilter === t
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t === EChallengeType.Chaos
                ? '🔮 Défis du Chaos'
                : t === EChallengeType.Mensuel
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
                      value={editDesc ?? ''}
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
                        ⏱️ {c.type === 'mensuel' ? 'Tout le mois' : `${c.duration_days} jours`} •{' '}
                        <span className="text-emerald-600 font-semibold">+{c.xp_bonus} XP</span> •{' '}
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
  );
};
