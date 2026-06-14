import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CONDITIONS } from '@/constants/avalaible_succes';
import { Achievement, AchievementFormData } from '@/types/achievement.type';

export const AdminAchievementsPage = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // Pour savoir quel succès on édite
  const [formData, setFormData] = useState<AchievementFormData>({
    title: '',
    description: '',
    condition_type: '',
    threshold: 0,
    xp_reward: 0,
  });

  const fetchAchievements = useCallback(async () => {
    const { data } = await supabase.from('achievements_definitions').select('*');
    if (data) setAchievements(data as Achievement[]);
  }, []);

  useEffect(() => {
    let isMounted = true; // Variable de sécurité

    const fetchData = async () => {
      const { data } = await supabase.from('achievements_definitions').select('*');
      if (isMounted && data) {
        setAchievements(data as Achievement[]);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Empêche la mise à jour si le composant est démonté
    };
  }, []);

  const handleDelete = async (id: string | null) => {
    if (confirm('Supprimer ce succès ?')) {
      await supabase.from('achievements_definitions').delete().eq('id', id!);
      fetchAchievements();
    }
  };

  const handleEdit = (a: Achievement) => {
    setEditingId(a.id);
    setFormData({
      title: a.title,
      description: a.description,
      condition_type: a.condition_type,
      threshold: a.threshold,
      xp_reward: a.xp_reward,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Mode Édition : Update
      const { error } = await supabase
        .from('achievements_definitions')
        .update({
          title: formData.title,
          description: formData.description,
          condition_type: formData.condition_type,
          threshold: formData.threshold,
          xp_reward: formData.xp_reward,
        })
        .eq('id', editingId);

      if (error) {
        console.error('Erreur détaillée Supabase :', error); // Regarde la console F12
        alert(`Erreur lors de la mise à jour : ${error.message}`);
      } else {
        setEditingId(null);
        setFormData({ title: '', description: '', condition_type: '', threshold: 0, xp_reward: 0 });
        fetchAchievements();
      }
    } else {
      // Mode Création
      const { error } = await supabase.from('achievements_definitions').insert([formData]);
      if (error) console.error(error);
      setFormData({ title: '', description: '', condition_type: '', threshold: 0, xp_reward: 0 });
      fetchAchievements();
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold dark:text-white">Gestion des Succès</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-800 p-6 rounded-xl dark:text-slate-300"
      >
        {/* Titre */}
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-xs font-semibold uppercase">
            Titre
          </label>
          <input
            id="title"
            required
            className="p-2 rounded border"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Condition */}
        <div className="flex flex-col gap-1">
          <label htmlFor="condition" className="text-xs font-semibold uppercase">
            Condition
          </label>
          <select
            id="condition"
            required
            className="p-2 rounded border bg-white dark:bg-slate-700"
            value={formData.condition_type}
            onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
          >
            <option value="">Choisir...</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1 col-span-2">
          <label htmlFor="desc" className="text-xs font-semibold uppercase">
            Description
          </label>
          <textarea
            id="desc"
            required
            className="p-2 rounded border"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Seuil */}
        <div className="flex flex-col gap-1">
          <label htmlFor="threshold" className="text-xs font-semibold uppercase">
            Seuil
          </label>
          <input
            id="threshold"
            type="number"
            required
            className="p-2 rounded border"
            value={formData.threshold}
            onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
          />
        </div>

        {/* XP Bonus */}
        <div className="flex flex-col gap-1">
          <label htmlFor="xp" className="text-xs font-semibold uppercase">
            XP Bonus
          </label>
          <input
            id="xp"
            type="number"
            required
            className="p-2 rounded border"
            value={formData.xp_reward}
            onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
          />
        </div>

        <button
          type="submit"
          className="col-span-2 bg-indigo-600 text-white p-3 rounded-lg font-bold"
        >
          {editingId ? 'Mettre à jour' : 'Ajouter le succès'}
        </button>
        {editingId && (
          <button type="button" onClick={() => setEditingId(null)} className="...">
            Annuler
          </button>
        )}
      </form>

      {/* Tableau récapitulatif */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border dark:border-slate-700">
        <table className="w-full text-sm text-left dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="p-4">Titre</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Seuil</th>
              <th className="p-4">XP</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((a) => (
              <tr key={a.id} className="border-t dark:border-slate-700">
                <td className="p-4">{a.title}</td>
                <td className="p-4">{a.condition_type}</td>
                <td className="p-4">{a.threshold}</td>
                <td className="p-4">{a.xp_reward}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(a)} className="text-blue-500">
                    Éditer
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-red-500">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
