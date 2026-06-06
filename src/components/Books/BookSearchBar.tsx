import { BookFormat, EBookFormat } from '@/types/books.type';
import { Search } from 'lucide-react';
import { SortOption } from '@/types/filters.type';

interface BookSearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  formatFilter: 'Tous' | EBookFormat;
  setFormatFilter: React.Dispatch<React.SetStateAction<'Tous' | EBookFormat>>;
  sortBy: SortOption;
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>;
  setCurrentPage: (value: number) => void;
}

export const BookSearchBar = ({
  search,
  setSearch,
  formatFilter,
  setFormatFilter,
  sortBy,
  setSortBy,
  setCurrentPage,
}: BookSearchBarProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
      <div className="sm:col-span-2 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un titre, auteur, saga..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
        />
      </div>

      <div>
        <select
          value={formatFilter}
          onChange={(e) => {
            setFormatFilter(e.target.value as BookFormat | 'Tous');
            setCurrentPage(1);
          }}
          className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs text-slate-700 dark:text-slate-300"
        >
          <option value="Tous">Formats : Tous</option>
          <option value={EBookFormat.Papier}>{EBookFormat.Papier}</option>
          <option value={EBookFormat.Numerique}>{EBookFormat.Numerique}</option>
          <option value={EBookFormat.Audio}>{EBookFormat.Audio}</option>
          <option value={EBookFormat.Kindle}>{EBookFormat.Kindle}</option>
        </select>
      </div>

      <div>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortOption);
            setCurrentPage(1);
          }}
          className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs text-slate-700 dark:text-slate-300"
        >
          <option value="added_desc">Plus récents d'abord</option>
          <option value="added_asc">Plus anciens d'abord</option>
          <option value="title_asc">Titre (A-Z)</option>
          <option value="author_asc">Auteur (A-Z)</option>
          <option value="saga_asc">Saga (A-Z)</option>
        </select>
      </div>
    </div>
  );
};
