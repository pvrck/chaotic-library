import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Book, BookStatus, BookFormat } from '@/types';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit3,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { formatDate } from '@/utils/date';

interface BookListProps {
  refreshTrigger: number;
  onBookStatusChanged: (status: BookStatus) => void;
}

interface BookDetails {
  description: string | null;
  pageCount: number | undefined;
  publishedDate: string | undefined;
  categories: string[] | undefined;
  image: string | undefined;
}

type SortOption = 'added_desc' | 'added_asc' | 'title_asc' | 'author_asc' | 'saga_asc';

export default function BookList({ refreshTrigger, onBookStatusChanged }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaosEvent, setChaosEvent] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [bookDetails, setBookDetails] = useState<BookDetails>();

  // Filtres, recherche, tris & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus | 'Tous'>('Tous');
  const [formatFilter, setFormatFilter] = useState<BookFormat | 'Tous'>('Tous');
  const [sortBy, setSortBy] = useState<SortOption>('added_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Déclencheur de défi chaotique
  const triggerChaosChallenge = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userChallenges, error } = await supabase
        .from('user_challenges')
        .select('id, status, challenge_pool(*)')
        .eq('user_id', user.id)
        .neq('status', 'en_cours');

      if (error) throw error;

      if (userChallenges && userChallenges.length > 0) {
        const randomIndex = Math.floor(Math.random() * userChallenges.length);
        const randomSelection = userChallenges[randomIndex];

        const randomChallengeArray = randomSelection.challenge_pool as
          | {
              title: string;
              xp_bonus?: number;
              xp_malus?: number;
            }[]
          | null;

        const randomChallenge =
          randomChallengeArray && randomChallengeArray.length > 0 ? randomChallengeArray[0] : null;

        if (randomChallenge) {
          const { error: updateError } = await supabase
            .from('user_challenges')
            .update({ status: 'en_cours' })
            .eq('id', randomSelection.id);

          if (updateError) throw updateError;

          const bonus = randomChallenge.xp_bonus || 0;
          const malus = randomChallenge.xp_malus || 0;

          let txtXP = '';
          if (bonus > 0) txtXP = `+${bonus} XP`;
          if (malus > 0) txtXP = `-${malus} XP (Malus ! 💀)`;
          if (bonus > 0 && malus > 0) txtXP = `+${bonus} XP / -${malus} XP`;

          setChaosEvent(
            `🔮 LE CHAOS A PARLÉ ! Nouveau défi débloqué : "${randomChallenge.title}" (${txtXP})`
          );
        }
      }
    } catch (err) {
      console.error('Erreur Défi Chaos:', err);
      alert('Le défi a été tiré mais impossible de mettre à jour ton statut en base.');
    }
  };

  const updateStatus = async (id: string, nextStatus: BookStatus) => {
    try {
      setChaosEvent(null); // Reset l'ancien popup à chaque action
      const updateData: Partial<Book> = { status: nextStatus };
      if (nextStatus === 'Lu') updateData.finished_at = new Date().toISOString();

      const { error } = await supabase.from('books').update(updateData).eq('id', id);
      if (error) throw error;

      // 🎲 JET DE DÉS DU CHAOS : 33% si le statut devient "Lu"

      if (nextStatus === 'Lu' && Math.random() < 0.33) {
        await triggerChaosChallenge();
      }

      // Logique XP
      let xp =
        nextStatus === 'En cours'
          ? 5
          : nextStatus === 'Lu'
            ? 120
            : nextStatus === 'Abandonné'
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
          is_lc: editingBook.is_lc || false,
          added_at: editingBook.added_at || new Date().toISOString(),
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

  const handleOpenDetails = async (book: Book) => {
    setSelectedBook(book);
    setDetailsLoading(true);
    setBookDetails(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

      if (!apiKey) {
        alert('La clé VITE_GOOGLE_BOOKS_API_KEY est manquante dans votre fichier .env');
        setFetching(false);
        return;
      }

      // 🔍 Recherche Google Books par titre + auteur
      const query = encodeURIComponent(`${book.title} ${book.author}`);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&key=${apiKey}`
      );

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const volume = data.items[0].volumeInfo;

        const details = {
          description: volume.description || null,
          pageCount: volume.pageCount,
          publishedDate: volume.publishedDate,
          categories: volume.categories,
          image: volume.imageLinks?.thumbnail,
        };

        setBookDetails(details);
      }
    } catch (err) {
      console.error('Erreur Google Books:', err);
    } finally {
      setDetailsLoading(false);
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
      const matchesSagaSort =
        sortBy !== 'saga_asc' || (book.saga_name !== null && book.saga_name?.trim() !== '');
      return matchesSearch && matchesStatus && matchesFormat && matchesSagaSort;
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
      {/* 🔮 BANNIÈRE SURPRISE DU CHAOS */}
      {chaosEvent && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl animate-bounce flex items-center gap-3 text-xs font-bold text-purple-700 dark:text-purple-400">
          <Sparkles className="h-5 w-5 shrink-0 text-purple-500 animate-pulse" />
          <span>{chaosEvent}</span>
        </div>
      )}

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
        {(['Tous', 'A lire', 'En cours', 'Lu', 'Abandonné'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-700/40'
            }`}
          >
            {st === 'Abandonné' ? 'Abandonnés' : st}
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
            {currentItems.map((book) => {
              return (
                <div
                  key={book.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  {/* Conteneur Image + Infos cliquable pour voir le détail */}
                  <div
                    className="flex-1 flex gap-4 items-center cursor-pointer group"
                    onClick={() => handleOpenDetails(book)}
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
                            setEditingBook(book);
                          }}
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
                      {book.added_at && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
                          Ajouté le {formatDate(book.added_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {book.status === 'A lire' && (
                      <button
                        onClick={() => updateStatus(book.id, 'En cours')}
                        className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        ⚔️ Commencer{' '}
                        <span className="text-[10px] opacity-90 font-normal">(+5 XP)</span>
                      </button>
                    )}
                    {book.status === 'En cours' && (
                      <>
                        <button
                          onClick={() => updateStatus(book.id, 'Lu')}
                          className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          🏆 Terminer{' '}
                          <span className="text-[10px] opacity-90 font-normal">(+120 XP)</span>
                        </button>
                        <button
                          onClick={() => updateStatus(book.id, 'Abandonné')}
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
                    {book.status === 'Abandonné' && (
                      <span className="text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
                        🛑 Abandonné
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Code ISBN (10 ou 13 chiffres)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 9782266200264"
                  value={editingBook.isbn || ''}
                  onChange={(e) =>
                    setEditingBook({
                      ...editingBook,
                      isbn: e.target.value.replace(/[^0-9X]/gi, ''),
                    })
                  } // Permet uniquement les chiffres et 'X'
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
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
                    <option value="Abandonné">Abandonné</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Option Lecture Commune */}
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isLc"
                    checked={editingBook.is_lc}
                    onChange={(e) => setEditingBook({ ...editingBook, is_lc: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isLc"
                    className="text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    Lecture commune (LC)
                  </label>
                </div>

                {/* Choix de la date */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Date d'ajout
                  </label>
                  <input
                    type="date"
                    value={editingBook.added_at.split('T')[0]}
                    onChange={(e) => setEditingBook({ ...editingBook, added_at: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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

      {/* 📖 MODALE DE DÉTAILS DU LIVRE */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <h3 className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                Fiche du livre
              </h3>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-4">
                <div className="h-24 w-16 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0 flex items-center justify-center">
                  {selectedBook?.thumbnail ? (
                    <img
                      src={selectedBook?.thumbnail}
                      alt={selectedBook.title}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">
                    {selectedBook.title}
                  </h2>
                  <p className="text-slate-500 font-medium">par {selectedBook.author}</p>
                  {selectedBook.saga_name && (
                    <p className="text-indigo-500 font-semibold mt-1">
                      🧬 Saga : {selectedBook.saga_name} (Vol. {selectedBook.saga_volume || '?'})
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Résumé / Description :
                </h4>

                {detailsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 italic py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    Invocation des archives de Google Books...
                  </div>
                ) : bookDetails?.description ? (
                  <div className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl max-h-48 overflow-y-auto leading-relaxed border border-slate-100 dark:border-slate-700/30">
                    {bookDetails.description}
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl text-center space-y-3">
                    <p className="text-amber-700 dark:text-amber-400 font-medium">
                      Aucun résumé trouvé dans Google Books.
                    </p>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        selectedBook.title + ' ' + selectedBook.author + ' livre résumé'
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
                onClick={() => setSelectedBook(null)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
