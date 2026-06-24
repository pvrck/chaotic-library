import SagaDetailModal from '@/components/Sagas/SagaDetailModal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Saga } from '@/types/saga.type';
import { Edit3, Library, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SagasPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [sagas, setSagas] = useState<Saga[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSaga, setSelectedSaga] = useState<Saga | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSagas = async () => {
    setLoading(true);
    const { data } = await supabase.from('sagas').select('*').order('title', { ascending: true });
    if (data) setSagas(data);
    setLoading(false);
  };

  useEffect(() => {
    const loadSagas = async () => {
      await fetchSagas();
    };

    loadSagas();
  }, []);

  // Filtrer les sagas selon la recherche
  const filteredSagas = sagas.filter(
    (saga) =>
      saga.title.toLowerCase().includes(search.toLowerCase()) ||
      (saga.author && saga.author.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDeleteSaga = async (sagaId: string) => {
    if (!isAdmin) {
      alert('Désolé, seul un administrateur peut supprimer une saga.');
      return;
    }

    const confirmed = window.confirm(
      'Es-tu sûre de vouloir supprimer cette saga ? Cela peut impacter les volumes liés.'
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('sagas').delete().eq('id', sagaId);

      if (error) throw error;

      // Mettre à jour ton état local pour rafraîchir l'affichage
      setSagas((prev) => prev.filter((s) => s.id !== sagaId));
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('Impossible de supprimer la saga.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Library className="h-5 w-5 text-indigo-500" /> Bibliothèque des Sagas
          </h2>
          <p className="text-xs text-slate-400">
            Consulte, complète et édite le catalogue partagé des sagas littéraires.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une saga, un auteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grille des sagas */}
      {loading ? (
        <div className="text-center text-xs text-slate-400 py-12">
          Chargement de l'index des reliques...
        </div>
      ) : filteredSagas.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Aucune saga trouvée dans les archives.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSagas.map((saga) => (
            <div
              key={saga.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate group-hover:text-indigo-500 transition-colors">
                  {saga.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  Par {saga.author || 'Auteur Inconnu'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 font-bold rounded-md text-slate-500 dark:text-slate-400">
                  {saga.total_volumes ? `${saga.total_volumes} tomes prévus` : 'Tomes indéterminés'}
                </span>

                <button
                  onClick={() => setSelectedSaga(saga)}
                  className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Edit3 className="h-3 w-3" /> Gérer
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteSaga(saga.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition détaillée si sélectionné */}
      {selectedSaga && (
        <SagaDetailModal
          saga={selectedSaga}
          onClose={() => setSelectedSaga(null)}
          onUpdateSuccess={fetchSagas}
        />
      )}
    </div>
  );
}
