import { useAuth } from '@/context/AuthContext';
import { sagaService } from '@/services/sagaService';
import { ESagaUserStatus, Saga } from '@/types/saga.type';
import { Library, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import de nos nouveaux composants découpés
import SagaCard from '@/components/Sagas/SagaCard';
import SagaPagination from '@/components/Sagas/SagaPagination';
import SagaDetailModal from '@/components/Sagas/SagaDetailModal';

export default function SagasPage() {
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  const [sagas, setSagas] = useState<Saga[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSaga, setSelectedSaga] = useState<Saga | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('all');

  const pageSize = 9;

  const fetchSagas = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const { data, count } = await sagaService.getSagasCatalog(
        currentUserId,
        currentPage,
        pageSize,
        currentFilter
      );
      setSagas(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Erreur catalogue :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!currentUserId) return;
      setLoading(true);
      try {
        const { data, count } = await sagaService.getSagasCatalog(
          currentUserId,
          currentPage,
          pageSize,
          currentFilter
        );
        setSagas(data);
        setTotalCount(count);
      } catch (error) {
        console.error('Erreur catalogue :', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId, currentPage, currentFilter, pageSize]);
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleStatusChange = async (sagaId: string, status: ESagaUserStatus | null) => {
    if (!currentUserId) return;
    try {
      await sagaService.updateManualStatus(currentUserId, sagaId, status);
      await fetchSagas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleFavorite = async (sagaId: string, currentFav: boolean) => {
    if (!currentUserId) return;
    try {
      await sagaService.toggleFavorite(currentUserId, sagaId, !currentFav);
      await fetchSagas();
    } catch (error) {
      console.error(error);
    }
  };

  const formatStatusLabel = (status: ESagaUserStatus | null) => {
    if (!status) return 'Favori ⭐';
    if (status === ESagaUserStatus.ALire) return 'À commencer';
    if (status === ESagaUserStatus.EnCours) return 'En cours';
    if (status === ESagaUserStatus.Termine) return 'Terminée';
    if (status === ESagaUserStatus.Abandonne) return 'Abandonnée';
    return status;
  };

  const filteredSagas = sagas.filter(
    (saga) =>
      saga.title.toLowerCase().includes(search.toLowerCase()) ||
      (saga.author && saga.author.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Library className="h-5 w-5 text-indigo-500" /> Bibliothèque des Sagas
          </h2>
          <p className="text-xs text-slate-400">
            Consulte l'index général et gère ta progression. ({totalCount} sagas répertoriées)
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer sur cette page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 🎛️ Barre de filtres rapides */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { id: 'all', label: '🌍 Toutes' },
          { id: 'en_cours', label: '📖 En cours' },
          { id: 'a_lire', label: '📚 Dans ma PAL' },
          { id: 'termine', label: '✅ Terminées' },
          { id: 'abandonne', label: '❌ Abandonnées' },
          { id: 'favorites', label: '⭐ Mes Favoris' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              setCurrentPage(1);
              setCurrentFilter(filter.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentFilter === filter.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Zone principale */}
      {loading ? (
        <div className="text-center text-xs text-slate-400 py-12">Chargement...</div>
      ) : filteredSagas.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-12 bg-white dark:bg-slate-900 border rounded-2xl">
          Aucune saga trouvée.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredSagas.map((saga) => (
              <SagaCard
                key={saga.id}
                saga={saga}
                onStatusChange={handleStatusChange}
                onToggleFavorite={handleToggleFavorite}
                onSelectSaga={setSelectedSaga}
                formatStatusLabel={formatStatusLabel}
              />
            ))}
          </div>

          <SagaPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
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
