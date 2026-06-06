import { Book, BookDetails } from '@/types/books.type';
import { BookOpen, Loader2, X } from 'lucide-react';

interface BookDetailsModalProps {
  book: Book;
  details: BookDetails | undefined;
  loading: boolean;
  onClose: () => void;
}

export const BookDetailsModal = ({ book, details, loading, onClose }: BookDetailsModalProps) => {
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
          <h3 className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
            Fiche du livre
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex gap-4">
            <div className="h-24 w-16 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0 flex items-center justify-center">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <BookOpen className="h-6 w-6 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">{book.title}</h2>
              <p className="text-slate-500 font-medium">par {book.author}</p>
              {book.saga_name && (
                <p className="text-indigo-500 font-semibold mt-1">
                  🧬 Saga : {book.saga_name} (Vol. {book.saga_volume || '?'})
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">
              Résumé / Description :
            </h4>

            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 italic py-4">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                Invocation des archives de Google Books...
              </div>
            ) : details?.description ? (
              <div className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl max-h-48 overflow-y-auto leading-relaxed border border-slate-100 dark:border-slate-700/30">
                {details.description}
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl text-center space-y-3">
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  Aucun résumé trouvé dans Google Books.
                </p>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    book.title + ' ' + book.author + ' livre résumé'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  🔍 Chercher le résumé sur Google
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer"
          >
            Fermer la fiche
          </button>
        </div>
      </div>
    </div>
  );
};
