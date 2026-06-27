import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SagaPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
}

export default function SagaPagination({
  currentPage,
  totalPages,
  onPageChange,
}: SagaPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 transition cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </button>

      <span className="text-xs font-bold text-slate-500 px-2">
        Page {currentPage} sur {totalPages}
      </span>

      <button
        onClick={() => onPageChange((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-40 transition cursor-pointer"
      >
        <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
}
