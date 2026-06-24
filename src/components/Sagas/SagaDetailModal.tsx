import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { Saga, SagaVolume } from '@/types/saga.type';

interface SagaDetailModalProps {
  saga: Saga;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function SagaDetailModal({ saga, onClose, onUpdateSuccess }: SagaDetailModalProps) {
  const [sagaTitle, setSagaTitle] = useState(saga.title);
  const [sagaAuthor, setSagaAuthor] = useState(saga.author || '');
  const [totalVolumes, setTotalVolumes] = useState<number | ''>(saga.total_volumes || '');
  const [volumes, setVolumes] = useState<SagaVolume[]>([]);

  // États de chargement et d'édition de volumes
  const [loading, setLoading] = useState(false);
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);

  // Formulaire pour ajouter/éditer un volume
  const [volNumber, setVolNumber] = useState<number | ''>('');
  const [volTitle, setVolTitle] = useState('');
  const [volPages, setVolPages] = useState<number | ''>('');

  const fetchVolumes = async () => {
    const { data } = await supabase
      .from('saga_volumes')
      .select('*')
      .eq('saga_id', saga.id)
      .order('volume_number', { ascending: true });
    if (data) setVolumes(data);
  };

  useEffect(() => {
    const loadVolumes = async () => {
      const { data } = await supabase
        .from('saga_volumes')
        .select('*')
        .eq('saga_id', saga.id)
        .order('volume_number', { ascending: true });
      if (data) setVolumes(data);
    };

    loadVolumes();
  }, [saga.id]);

  // Sauvegarder les infos générales de la saga
  const handleSaveSagaInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sagas')
        .update({
          title: sagaTitle,
          author: sagaAuthor || null,
          total_volumes: totalVolumes === '' ? null : totalVolumes,
        })
        .eq('id', saga.id);

      if (error) throw error;
      onUpdateSuccess();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour de la saga.');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter ou mettre à jour un volume (Tome)
  const handleSaveVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volNumber || !volTitle.trim()) return;

    try {
      const payload = {
        saga_id: saga.id,
        volume_number: volNumber,
        title: volTitle.trim(),
        page_count: volPages === '' ? null : volPages,
      };

      if (editingVolumeId) {
        await supabase.from('saga_volumes').update(payload).eq('id', editingVolumeId);
      } else {
        await supabase
          .from('saga_volumes')
          .upsert(payload, { onConflict: 'saga_id,volume_number' });
      }

      // Reset formulaire
      setVolNumber('');
      setVolTitle('');
      setVolPages('');
      setEditingVolumeId(null);
      fetchVolumes();
    } catch (err) {
      console.error(err);
      alert("Erreur avec le volume (vérifie si ce numéro de tome n'existe pas déjà).");
    }
  };

  const handleEditVolumeClick = (vol: SagaVolume) => {
    setEditingVolumeId(vol.id);
    setVolNumber(vol.volume_number);
    setVolTitle(vol.title);
    setVolPages(vol.page_count || '');
  };

  const handleDeleteVolume = async (id: string) => {
    if (!confirm('Supprimer ce tome de la base globale ?')) return;
    await supabase.from('saga_volumes').delete().eq('id', id);
    fetchVolumes();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
            Éditer la Saga
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire Général de la Saga */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-indigo-500 text-[11px] uppercase tracking-wider">
            Informations Générales
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nom de la saga
              </label>
              <input
                type="text"
                value={sagaTitle}
                onChange={(e) => setSagaTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Auteur
              </label>
              <input
                type="text"
                value={sagaAuthor}
                onChange={(e) => setSagaAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tomes prévus
              </label>
              <input
                type="number"
                value={totalVolumes}
                onChange={(e) => setTotalVolumes(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Ex: 7"
              />
            </div>
          </div>
          <button
            onClick={handleSaveSagaInfo}
            disabled={loading}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}{' '}
            Mettre à jour les infos
          </button>
        </div>

        {/* Gestion des volumes / Tomes */}
        <div className="space-y-4">
          <h4 className="font-bold text-indigo-500 text-[11px] uppercase tracking-wider">
            Squelette de la Saga (Tomes)
          </h4>

          {/* Formulaire ajout/édition rapide d'un volume */}
          <form
            onSubmit={handleSaveVolume}
            className="grid grid-cols-4 gap-2 items-end bg-slate-50/60 dark:bg-slate-900/20 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700"
          >
            <div>
              <label className="block font-bold text-slate-500 mb-0.5">N° Tome</label>
              <input
                type="number"
                required
                value={volNumber}
                onChange={(e) => setVolNumber(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-500 mb-0.5">Titre du tome</label>
              <input
                type="text"
                required
                placeholder="Ex: Le Prisonnier d'Azkaban"
                value={volTitle}
                onChange={(e) => setVolTitle(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-slate-800 dark:bg-slate-700 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-colors"
              >
                {editingVolumeId ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{' '}
                {editingVolumeId ? 'OK' : 'Ajouter'}
              </button>
            </div>
          </form>

          {/* Liste des tomes existants */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {volumes.length === 0 ? (
              <p className="text-center text-slate-400 italic py-4">
                Aucun tome enregistré pour l'instant.
              </p>
            ) : (
              volumes.map((vol) => (
                <div
                  key={vol.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-indigo-600 dark:text-indigo-400">
                      T.{vol.volume_number}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {vol.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditVolumeClick(vol)}
                      className="p-1 text-slate-400 hover:text-indigo-500 rounded transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteVolume(vol.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
