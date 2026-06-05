import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Book, BookStatus, BookFormat } from '@/types';
import { Search, ChevronLeft, ChevronRight, Loader2, Edit3, X } from 'lucide-react';

interface BookListProps {
  refreshTrigger: number;
  onBookStatusChanged: (status: BookStatus) => void;
}

type SortOption = 'added_desc' | 'added_asc' | 'title_asc' | 'author_asc' | 'saga_asc';

export default function BookList({ refreshTrigger, onBookStatusChanged }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres, recherche, tris & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'Tous'>('Tous');
  const [formatFilter, setFormatFilter] = useState<BookFormat | 'Tous'>('Tous');
  const [sortBy, setSortBy] = useState<SortOption>('added_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Gestion de l'édition
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => await fetchBooks())();
  }, [refreshTrigger]);

  const updateStatus = async (id: string, nextStatus: BookStatus) => {
    try {
      const updateData: Partial<Book> = { status: nextStatus };
      if (nextStatus === 'Lu') updateData.finished_at = new Date().toISOString();

      const { error } = await supabase.from('books').update(updateData).eq('id', id);
      if (error) throw error;

      // Logique XP
      let xp =
        nextStatus === 'En cours'
          ? 5
          : nextStatus === 'Lu'
            ? 120
            : nextStatus === 'abandonne'
              ? 10
              : 0;
      const targetBook = books.find((b) => b.id === id);
      if (nextStatus === 'Lu' && targetBook?.saga_name) xp += 30;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && xp > 0) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .single();
        await supabase
          .from('profiles')
          .update({ xp: (prof?.xp || 0) + xp })
          .eq('id', user.id);
      }

      fetchBooks();
      onBookStatusChanged(nextStatus);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors du changement de statut.';

      console.error('Détail complet :', error);
      alert(errorMessage);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    setEditLoading(true);

    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: editingBook.title,
          author: editingBook.author,
          saga_name: editingBook.saga_name || null,
          saga_volume: editingBook.saga_volume || null,
          format: editingBook.format,
          status: editingBook.status,
        })
        .eq('id', editingBook.id);

      if (error) throw error;

      setEditingBook(null);
      fetchBooks();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la mise à jour du livre.');
    } finally {
      setEditLoading(false);
    }
  };

  // --- TRAITEMENT DES DONNÉES (FILTRE & TRI) ---
  const filteredAndSortedBooks = books
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        (book.saga_name && book.saga_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'Tous' || book.status === statusFilter;
      const matchesFormat = formatFilter === 'Tous' || book.format === formatFilter;
      return matchesSearch && matchesStatus && matchesFormat;
    })
    .sort((a, b) => {
      if (sortBy === 'added_desc')
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
      if (sortBy === 'added_asc')
        return new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'author_asc') return a.author.localeCompare(b.author);
      if (sortBy === 'saga_asc') return (a.saga_name || '').localeCompare(b.saga_name || '');
      return 0;
    });

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredAndSortedBooks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedBooks.slice(indexOfFirstItem, indexOfLastItem);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="w-full space-y-4 relative">
      {/* 🔍 BARRE DE RECHERCHE ET FILTRES */}
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
            <option value="Papier">Papier</option>
            <option value="eBook">eBook</option>
            <option value="Audio">Audio</option>
            <option value="Kindle">Kindle</option>
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

      {/* 📑 SOUS-ONGLETS DE STATUT */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['Tous', 'A lire', 'En cours', 'Lu', 'abandonne'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-700/40'
            }`}
          >
            {st === 'abandonne' ? 'Abandonnés' : st}
          </button>
        ))}
      </div>

      {/* 📚 LISTE DES LIVRES */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-xs">
        {currentItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Aucun livre ne correspond à tes critères de recherche... 🕸️
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {currentItems.map((book) => (
              <div
                key={book.id}
                className="p-4 flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* BADGE PASSIF : Reste plat et discret */}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md text-slate-500 font-medium select-none">
                      {book.format}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-white">{book.title}</h4>
                    <button
                      onClick={() => setEditingBook(book)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Modifier les détails"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-slate-400 mt-0.5">
                    par{' '}
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {book.author}
                    </span>
                  </p>
                  {book.saga_name && (
                    <p className="text-[11px] text-indigo-500 font-medium mt-0.5">
                      🧬 Saga : {book.saga_name} (Vol. {book.saga_volume || '?'})
                    </p>
                  )}
                </div>

                {/* BOUTONS D'ACTION : Deviennent de vrais boutons cliquables avec du relief */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {book.status === 'A lire' && (
                    <button
                      onClick={() => updateStatus(book.id, book.status, 'En cours')}
                      className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      ⚔️ Commencer{' '}
                      <span className="text-[10px] opacity-90 font-normal">(+5 XP)</span>
                    </button>
                  )}
                  {book.status === 'En cours' && (
                    <>
                      <button
                        onClick={() => updateStatus(book.id, book.status, 'Lu')}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        🏆 Terminer{' '}
                        <span className="text-[10px] opacity-90 font-normal">(+120 XP)</span>
                      </button>
                      <button
                        onClick={() => updateStatus(book.id, book.status, 'abandonne')}
                        className="cursor-pointer bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 transition-all"
                      >
                        Abandonner
                      </button>
                    </>
                  )}
                  {book.status === 'Lu' && (
                    <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
                      🎉 Terminé
                    </span>
                  )}
                  {book.status === 'abandonne' && (
                    <span className="text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
                      🛑 Abandonné
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎛️ CONTROLES PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
          <span className="text-xs text-slate-500">
            Page {currentPage} sur {totalPages} ({filteredAndSortedBooks.length} livres)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/40 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ MODALE CONTEXTUELLE D'ÉDITION */}
      {editingBook && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Modifier la relique
              </h3>
              <button
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  required
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Auteur
                </label>
                <input
                  type="text"
                  required
                  value={editingBook.author}
                  onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Saga (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={editingBook.saga_name || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, saga_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vol.
                  </label>
                  <input
                    type="number"
                    value={editingBook.saga_volume || ''}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        saga_volume: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={editingBook.format}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, format: e.target.value as BookFormat })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Papier">Papier</option>
                    <option value="eBook">eBook</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={editingBook.status}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, status: e.target.value as BookStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="A lire">À lire</option>
                    <option value="En cours">En cours</option>
                    <option value="Lu">Lu</option>
                    <option value="abandonne">Abandonné</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {editLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
