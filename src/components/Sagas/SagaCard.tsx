import { ESagaUserStatus, Saga } from '@/types/saga.type';
import { Bookmark, BookmarkCheck, Edit3 } from 'lucide-react';
import SagaReadersTooltip from './SagaReadersTooltip';

interface SagaCardProps {
  saga: Saga;
  onStatusChange: (sagaId: string, status: ESagaUserStatus | null) => void;
  onToggleFavorite: (sagaId: string, currentFav: boolean) => void;
  onSelectSaga: (saga: Saga) => void;
  formatStatusLabel: (status: ESagaUserStatus | null) => string;
}

export default function SagaCard({
  saga,
  onStatusChange,
  onToggleFavorite,
  onSelectSaga,
  formatStatusLabel,
}: SagaCardProps) {
  const { status, is_favorite } = saga.user_interaction;

  const badgeColors = {
    [ESagaUserStatus.ALire]:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50',
    [ESagaUserStatus.EnCours]:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
    [ESagaUserStatus.Termine]:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
    [ESagaUserStatus.Abandonne]:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group">
      <div>
        <div className="flex items-center justify-between min-h-[24px] mb-2">
          <div>
            {status ? (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeColors[status]}`}
              >
                {formatStatusLabel(status)}
              </span>
            ) : (
              <button
                onClick={() => onToggleFavorite(saga.id, is_favorite)}
                className="text-slate-300 hover:text-amber-500 dark:text-slate-600 transition cursor-pointer"
              >
                {is_favorite ? (
                  <BookmarkCheck className="h-4 w-4 text-amber-500" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          <SagaReadersTooltip readers={saga.readers} formatStatusLabel={formatStatusLabel} />
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate group-hover:text-indigo-500 transition-colors">
            {saga.title}
          </h3>
          <p className="text-xs text-slate-400 truncate">Par {saga.author || 'Auteur Inconnu'}</p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50">
          <select
            value={status || ''}
            onChange={(e) => onStatusChange(saga.id, (e.target.value as ESagaUserStatus) || null)}
            className="w-full text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="">Hors bibliothèque / Non suivie</option>
            <option value={ESagaUserStatus.ALire}>📚 Dans ma PAL (À commencer)</option>
            <option value={ESagaUserStatus.EnCours}>📖 En cours de lecture</option>
            <option value={ESagaUserStatus.Termine}>✅ Complétée</option>
            <option value={ESagaUserStatus.Abandonne}>❌ Abandonnée</option>
          </select>
        </div>

        <div className="pt-2 border-t flex items-center justify-between text-[11px]">
          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 font-bold rounded-md text-slate-500">
            {saga.total_volumes ? `${saga.total_volumes} tomes` : 'Tomes indét.'}
          </span>
          <button
            onClick={() => onSelectSaga(saga)}
            className="flex items-center gap-1 font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            <Edit3 className="h-3 w-3" /> Gérer
          </button>
        </div>
      </div>
    </div>
  );
}
