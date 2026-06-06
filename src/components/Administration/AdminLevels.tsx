import { Level } from '@/types/levels.type';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';

interface AdminLevelsProps {
  levels: Level[];
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminLevels = ({ levels, setRefreshTrigger }: AdminLevelsProps) => {
  const [newLevelXp, setNewLevelXp] = useState<number>(0);
  const [newLevelTitle, setNewLevelTitle] = useState<string>('');
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [editLevelXp, setEditLevelXp] = useState<number>(0);
  const [editLevelTitle, setEditLevelTitle] = useState<string>('');

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

  const startEditingLevel = (lvl: Level) => {
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

  return (
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
  );
};
