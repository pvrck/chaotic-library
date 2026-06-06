import { Edit3, BookOpen } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { Book, EBookStatus } from '@/types/books.type';

interface BookItemProps {
  book: Book;
  onStatusChange: (id: string, nextStatus: EBookStatus) => Promise<void>;
  onOpenDetails: (book: Book) => void;
  onEditClick: (book: Book) => void;
}

export const BookItem = ({ book, onStatusChange, onOpenDetails, onEditClick }: BookItemProps) => {
  return (
    <div
      key={book.id}
      className="p-4 flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
    >
      {/* Conteneur Image + Infos cliquable pour voir le détail */}
      <div
        className="flex-1 flex gap-4 items-center cursor-pointer group"
        onClick={() => onOpenDetails(book)}
      >
        {/* Couverture du livre */}
        <div className="h-16 w-12 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-xs group-hover:shadow-md transition-shadow relative">
          {book?.thumbnail ? (
            <img
              src={book?.thumbnail}
              alt={book.title}
              className="h-full w-full object-cover rounded-xl"
            />
          ) : (
            <BookOpen className="h-6 w-6 text-slate-300 dark:text-slate-600" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-slate-500 font-medium select-none">
              {book.format}
            </span>
            {book.is_lc && (
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 px-1.5 py-0.5 rounded-md text-purple-600 dark:text-purple-400 font-bold select-none">
                👥 LC
              </span>
            )}
            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
              {book.title}
            </h4>

            {/* Bouton d'édition isolé du clic global grâce à e.stopPropagation() */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Évite d'ouvrir les détails
                onEditClick(book);
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Modifier les détails"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>

          <p className="text-slate-400 mt-0.5">
            par{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">{book.author}</span>
          </p>
          {book.saga_name && (
            <p className="text-[11px] text-indigo-500 font-medium mt-0.5">
              🧬 Saga : {book.saga_name} (Vol. {book.saga_volume || '?'})
            </p>
          )}
          {book.added_at && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
              Ajouté le {formatDate(book.added_at)}
            </p>
          )}
        </div>
      </div>

      {/* BOUTONS D'ACTION */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {book.status === EBookStatus.ALire && (
          <button
            onClick={() => onStatusChange(book.id!, EBookStatus.EnCours)}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            ⚔️ Commencer <span className="text-[10px] opacity-90 font-normal">(+5 XP)</span>
          </button>
        )}
        {book.status === EBookStatus.EnCours && (
          <>
            <button
              onClick={() => onStatusChange(book.id!, EBookStatus.Lu)}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              🏆 Terminer <span className="text-[10px] opacity-90 font-normal">(+120 XP)</span>
            </button>
            <button
              onClick={() => onStatusChange(book.id!, EBookStatus.Abandonne)}
              className="cursor-pointer bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 transition-all"
            >
              Abandonner
            </button>
          </>
        )}
        {book.status === EBookStatus.Lu && (
          <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
            🎉 Terminé
          </span>
        )}
        {book.status === EBookStatus.Abandonne && (
          <span className="text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
            🛑 Abandonné
          </span>
        )}
      </div>
    </div>
  );
};
