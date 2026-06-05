import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Book, BookStatus } from '@/types';
import {
  BookOpen,
  CheckCircle,
  Play,
  Archive,
  Trash2,
  Loader2,
  Smartphone,
  Book as BookIcon,
  Headphones,
  Flame,
} from 'lucide-react';

interface BookListProps {
  refreshTrigger: number;
  onBookStatusChanged: (status: BookStatus) => void;
}

export default function BookList({ refreshTrigger, onBookStatusChanged }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookStatus>('A lire');

  const fetchBooks = async () => {
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
  };

  // Recharge les livres quand le composant monte OU quand le parent dit qu'un livre a été ajouté
  useEffect(() => {
    fetchBooks();
  }, [refreshTrigger]);

  const updateStatus = async (id: string, currentStatus: BookStatus) => {
    let nextStatus: BookStatus = 'A lire';
    if (currentStatus === 'A lire') nextStatus = 'En cours';
    else if (currentStatus === 'En cours') nextStatus = 'Lu';

    try {
      const updateData: any = { status: nextStatus };
      if (nextStatus === 'Lu') {
        updateData.finished_at = new Date().toISOString();
      }

      const { error } = await supabase.from('books').update(updateData).eq('id', id);
      if (error) throw error;

      fetchBooks();

      // On prévient le parent (pratique pour déclencher le Chaos plus tard !)
      onBookStatusChanged(nextStatus);
    } catch (error) {
      alert('Impossible de mettre à jour le statut.');
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Supprimer définitivement ce livre ?')) return;
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      fetchBooks();
    } catch (error) {
      alert('Erreur lors de la suppression.');
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
      {/* Onglets style Mobile-First */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const count = books.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

      {/* Liste des livres */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <p className="text-center text-slate-400 py-12 text-sm italic">
          Aucun livre dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/30 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">
                  {book.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  par {book.author}
                </p>

                {/* Badges Format & Sagas */}
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

              {/* Actions rapides */}
              <div className="flex items-center gap-2">
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
                  onClick={() => deleteBook(book.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
