import { Book } from '@/types/books.type';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  filteredAndSortedBooks: Book[];
}

export const BookPagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  filteredAndSortedBooks,
}: BookPaginationProps) => {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
      <span className="text-xs text-slate-500">
        Page {currentPage} sur {totalPages} ({filteredAndSortedBooks.length} livres)
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
