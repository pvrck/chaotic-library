import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChallengePoolItem } from '@/types';
import {
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  ListPlus,
  Clock,
  Trophy,
  Skull,
  Pencil,
  X,
  Save,
} from 'lucide-react';

export default function AdminChallengePool() {
  const [challenges, setChallenges] = useState<ChallengePoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // État pour savoir si on édite un défi
  const [editingId, setEditingId] = useState<string | null>(null);

  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'mensuel' | 'chaos'>('chaos');
  const [durationDays, setDurationDays] = useState('7');
  const [xpBonus, setXpBonus] = useState('100');
  const [xpMalus, setXpMalus] = useState('50');

  const fetchPool = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenge_pool')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération du pool:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPool = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenge_pool')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setChallenges(data || []);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du pool:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPool();

    return () => {
      isMounted = false;
    };
  }, []);

  // Active le mode édition et pré-remplit le formulaire
  const startEdit = (item: ChallengePoolItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setType(item.type);
    setDurationDays(item.duration_days.toString());
    setXpBonus(item.xp_bonus.toString());
    setXpMalus(item.xp_malus.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setType('chaos');
    setDurationDays('7');
    setXpBonus('100');
    setXpMalus('50');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      if (editingId) {
        // Mode MISE À JOUR (Édition)
        const { error } = await supabase
          .from('challenge_pool')
          .update({
            title,
            description: description.trim() || null,
            type,
            duration_days: parseInt(durationDays) || 7,
            xp_bonus: parseInt(xpBonus) || 100,
            xp_malus: parseInt(xpMalus) || 50,
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Mode AJOUT classique
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Non connecté');

        const { error } = await supabase.from('challenge_pool').insert([
          {
            title,
            description: description.trim() || null,
            type,
            duration_days: parseInt(durationDays) || 7,
            xp_bonus: parseInt(xpBonus) || 100,
            xp_malus: parseInt(xpMalus) || 50,
            created_by: user.id,
          },
        ]);

        if (error) throw error;
      }

      setTitle('');
      setDescription('');
      setXpBonus('100');
      setXpMalus('50');
      setDurationDays('7');
      fetchPool();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur d'enregistrement";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Retirer ce défi de la liste des possibles ?')) return;
    try {
      const { error } = await supabase.from('challenge_pool').delete().eq('id', id);
      if (error) throw error;
      if (editingId === id) cancelEdit();
      fetchPool();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de supprimer le défi.';
      alert(msg);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700/50">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
        <ListPlus className="h-5 w-5 text-indigo-600" /> Fabrique à Défis (Admin)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulaire dynamique */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-1 space-y-4 border-r border-slate-100 dark:border-slate-700/50 pr-0 md:pr-6"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {editingId ? '✏️ Modifier le défi' : '✨ Nouveau défi'}
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Intitulé du défi *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Lire un livre de poche"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Description (Optionnel)
            </label>
            <textarea
              placeholder="Précisions sur les contraintes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {type === 'chaos' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Délai pour le réussir (en jours)
              </label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Gain XP (Bonus)
              </label>
              <input
                type="number"
                min="0"
                value={xpBonus}
                onChange={(e) => setXpBonus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Perte XP (Malus)
              </label>
              <input
                type="number"
                min="0"
                value={xpMalus}
                onChange={(e) => setXpMalus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type de défi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('chaos')}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                  type === 'chaos'
                    ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300'
                    : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                <Sparkles className="h-3 w-3" /> Chaos
              </button>
              <button
                type="button"
                onClick={() => setType('mensuel')}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                  type === 'mensuel'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                    : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                <Calendar className="h-3 w-3" /> Mensuel
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" /> Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50 ${
                editingId
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500'
              }`}
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : editingId ? (
                <>
                  <Save className="h-3 w-3" /> Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> Injecter
                </>
              )}
            </button>
          </div>
        </form>

        {/* Liste des défis avec bouton Éditer */}
        <div className="md:col-span-2 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 sticky top-0 bg-white dark:bg-slate-800 pb-2">
            Réservoir actuel ({challenges.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">Le réservoir est vide.</p>
          ) : (
            <div className="space-y-2">
              {challenges.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${
                    editingId === item.id
                      ? 'bg-indigo-50/50 border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-800'
                      : 'bg-slate-50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-700/30'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          item.type === 'chaos'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.type === 'chaos' ? '🎲 CHAOS' : '📅 MENSUEL'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {item.title}
                      </h4>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {item.type === 'chaos' && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-purple-500" /> {item.duration_days}j
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Trophy className="h-3 w-3" /> +{item.xp_bonus} XP
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <Skull className="h-3 w-3" /> -{item.xp_malus} XP
                      </span>
                    </div>
                  </div>

                  {/* Actions : Éditer et Supprimer */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                      title="Modifier ce défi"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
