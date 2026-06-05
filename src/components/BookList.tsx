import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Book, BookStatus, BookFormat } from '@/types';
import {
  CheckCircle,
  Play,
  Trash2,
  Loader2,
  Smartphone,
  Book as BookIcon,
  Headphones,
  Flame,
  Pencil,
  X,
  Save,
} from 'lucide-react';

interface BookListProps {
  refreshTrigger: number;
  onBookStatusChanged: (status: BookStatus) => void;
}

export default function BookList({ refreshTrigger, onBookStatusChanged }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookStatus>('A lire');

  // États pour l'édition en ligne d'un livre
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editFormat, setEditFormat] = useState<BookFormat>('Papier');
  const [editSagaName, setEditSagaName] = useState('');
  const [editSagaVolume, setEditSagaVolume] = useState('');

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchBooks();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchBooks, refreshTrigger]);

  // Lance l'édition en ligne pour une ligne donnée
  const startEditBook = (book: Book) => {
    setEditingBookId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditFormat(book.format);
    setEditSagaName(book.saga_name || '');
    setEditSagaVolume(book.saga_volume?.toString() || '');
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
  };

  const saveBookEdit = async (id: string) => {
    if (!editTitle.trim() || !editAuthor.trim()) return;
    try {
      const { error } = await supabase
        .from('books')
        .update({
          title: editTitle.trim(),
          author: editAuthor.trim(),
          format: editFormat,
          saga_name: editSagaName.trim() || null,
          saga_volume: editSagaVolume ? parseInt(editSagaVolume) : null,
        })
        .eq('id', id);

      if (error) throw error;
      setEditingBookId(null);
      fetchBooks();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Erreur lors de la modification du livre.';
      alert(msg);
    }
  };

  const updateStatus = async (id: string, currentStatus: BookStatus) => {
    let nextStatus: BookStatus = 'A lire';
    if (currentStatus === 'A lire') nextStatus = 'En cours';
    else if (currentStatus === 'En cours') nextStatus = 'Lu';

    try {
      const updateData: Partial<Book> = { status: nextStatus };
      if (nextStatus === 'Lu') {
        updateData.finished_at = new Date().toISOString();
      }

      const { error } = await supabase.from('books').update(updateData).eq('id', id);
      if (error) throw error;

      fetchBooks();
      onBookStatusChanged(nextStatus);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de mettre à jour le statut.';
      alert(msg);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Supprimer définitivement ce livre ?')) return;
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      fetchBooks();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la suppression.';
      alert(msg);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'Papier':
        return <BookIcon className="h-3 w-3 inline mr-1 text-amber-600" />;
      case 'Numérique':
        return <Smartphone className="h-3 w-3 inline mr-1 text-blue-500" />;
      case 'Audio':
        return <Headphones className="h-3 w-3 inline mr-1 text-purple-500" />;
      case 'Kindle':
        return <Flame className="h-3 w-3 inline mr-1 text-orange-500" />;
      default:
        return null;
    }
  };

  const filteredBooks = books.filter((book) => book.status === activeTab);
  const tabs: BookStatus[] = ['A lire', 'En cours', 'Lu', 'Abandonné'];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700/50">
      {/* Onglets */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const count = books.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                cancelEditBook();
              }}
              className={`flex-1 min-w-[100px] text-center pb-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors relative ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'A lire'
                ? '📚 PAL'
                : tab === 'En cours'
                  ? '⏳ En cours'
                  : tab === 'Lu'
                    ? '✅ Lus'
                    : '❌ Abandon'}
              <span className="ml-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <p className="text-center text-slate-400 py-12 text-sm italic">Aucun livre ici.</p>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                editingBookId === book.id
                  ? 'bg-indigo-50/40 border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700/30'
              }`}
            >
              {editingBookId === book.id ? (
                /* 📝 ETAT : EDITION EN LIGNE */
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-0 sm:pr-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    placeholder="Titre"
                  />
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Auteur"
                  />
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as BookFormat)}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Papier">📚 Papier</option>
                    <option value="Numérique">📱 Numérique</option>
                    <option value="Audio">🎧 Audio</option>
                    <option value="Kindle">🔥 Kindle</option>
                  </select>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editSagaName}
                      onChange={(e) => setEditSagaName(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Saga (optionnel)"
                    />
                    <input
                      type="number"
                      value={editSagaVolume}
                      onChange={(e) => setEditSagaVolume(e.target.value)}
                      className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Tome"
                    />
                  </div>
                </div>
              ) : (
                /* 🕶️ ETAT : AFFICHAGE CLASSIQUE */
                <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">
                    {book.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    par {book.author}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs font-medium">
                      {getFormatIcon(book.format)} {book.format}
                    </span>
                    {book.saga_name && (
                      <span className="inline-flex items-center text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-semibold">
                        🔮 {book.saga_name} (T. {book.saga_volume})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Barre d'actions */}
              <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700/50">
                {editingBookId === book.id ? (
                  <>
                    <button
                      onClick={() => saveBookEdit(book.id)}
                      className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 rounded-xl transition-colors"
                      title="Enregistrer"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditBook}
                      className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="Annuler"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {book.status === 'A lire' && (
                      <button
                        onClick={() => updateStatus(book.id, book.status)}
                        className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 rounded-xl transition-colors"
                        title="Commencer la lecture"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {book.status === 'En cours' && (
                      <button
                        onClick={() => updateStatus(book.id, book.status)}
                        className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 rounded-xl transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => startEditBook(book)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-colors"
                      title="Modifier les infos"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
