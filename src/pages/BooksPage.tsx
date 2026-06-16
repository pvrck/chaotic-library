import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useBooks } from '@/hooks/useBooks';
import { triggerChaosChallenge, handleXpGain } from '@/services/chaosService';
import { Book, EBookStatus } from '@/types/books.type';
import { Loader2, Sparkles, PlusCircle, Book as BookIcon } from 'lucide-react';

import { BookSearchBar } from '@/components/Books/BookSearchBar';
import { BookItem } from '@/components/Books/BookItem';
import { BookPagination } from '@/components/Books/BookPagination';
import { BookDetailsModal } from '@/components/Books/BookDetailsModal';
import BookFormModal from '@/components/Books/BookFormModal';
import { checkAchievements } from '@/services/achievementService';
import { EAchievementConditionType } from '@/types/achievement.type';
import { toast } from 'sonner';

export const BooksPage = () => {
  const { session, refreshProfile } = useAuth();
  const [chaosEvent, setChaosEvent] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);

  const b = useBooks();

  const updateStatus = async (id: string, nextStatus: EBookStatus) => {
    try {
      setChaosEvent(null);
      const updateData: Partial<Book> = { status: nextStatus };
      if (nextStatus === EBookStatus.Lu) updateData.finished_at = new Date().toISOString();

      const { error } = await supabase.from('books').update(updateData).eq('id', id);
      if (error) throw error;

      // 🎲 Jet du Chaos (33%)
      if (nextStatus === EBookStatus.Lu && Math.random() < 0.33) {
        const msg = await triggerChaosChallenge();
        if (msg) setChaosEvent(msg);
      }

      // 🏆 Gestion de l'XP
      const targetBook = b.books.find((book) => book.id === id);
      await handleXpGain(nextStatus, targetBook);

      // 🚀 Vérification des succès (si le livre est terminé)
      if (nextStatus === EBookStatus.Lu) {
        const promises = [
          checkAchievements(session?.user.id, EAchievementConditionType.LivresLus),
          checkAchievements(session?.user.id, EAchievementConditionType.LivresAnnee),
        ];

        if (targetBook?.saga_name) {
          promises.push(checkAchievements(session?.user.id, EAchievementConditionType.SagaAvancee));
        }

        if (targetBook?.is_lc) {
          promises.push(
            checkAchievements(session?.user.id, EAchievementConditionType.ParticipationLc)
          );
        }

        // 1. On attend tous les résultats
        const results = await Promise.all(promises);

        // 2. On aplatit le tableau et on filtre pour ne garder que les titres trouvés
        const unlockedTitles = results
          .flat()
          .filter((title) => title !== undefined && title !== null);

        // 3. On ne fait quelque chose QUE s'il y a des titres réellement débloqués
        if (unlockedTitles.length > 0) {
          if (unlockedTitles.length === 1) {
            toast.success(`Bravo ! Succès débloqué : ${unlockedTitles[0]}`);
          } else {
            toast.success('Félicitations, vous avez débloqué plusieurs succès !', {
              description: unlockedTitles.join(' • '),
              duration: 5000,
            });
          }
        }
      }

      b.fetchBooks();
      if (session?.user) refreshProfile();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Erreur statut.');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books') // Utilise le nom exact de ta table de liaison/livres
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      // Mise à jour de l'état local pour faire disparaître le livre proprement
      b.fetchBooks();
    } catch (err) {
      console.error('Erreur lors de la suppression du livre :', err);
      alert('Impossible de supprimer le livre. Recommence pour voir ?');
    }
  };

  if (b.loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookIcon className="h-6 w-6 text-indigo-600" /> Ma Bibliothèque
        </h1>
        <button
          onClick={() => {
            setBookToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Ajouter un livre
        </button>
      </header>

      <div className="w-full space-y-4 relative">
        {chaosEvent && (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl animate-bounce flex items-center gap-3 text-xs font-bold text-purple-700 dark:text-purple-400">
            <Sparkles className="h-5 w-5 shrink-0 text-purple-500 animate-pulse" />
            <span>{chaosEvent}</span>
          </div>
        )}

        <BookSearchBar
          search={b.search}
          setSearch={b.setSearch}
          formatFilter={b.formatFilter}
          setFormatFilter={b.setFormatFilter}
          sortBy={b.sortBy}
          setSortBy={b.setSortBy}
          setCurrentPage={b.setCurrentPage}
        />

        {/* 📑 SOUS-ONGLETS DE STATUT */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(['Tous', ...Object.values(EBookStatus)] as const).map((st) => {
            const allBooks = b.books;

            const count =
              st === 'Tous' ? allBooks.length : allBooks.filter((bk) => bk.status === st).length;

            return (
              <button
                key={st}
                onClick={() => {
                  b.setStatusFilter(st);
                  b.setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                  b.statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700/40'
                }`}
              >
                {st === EBookStatus.Abandonne ? 'Abandonnés' : st}
                {/* 2. On affiche le badge de nombre */}
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    b.statusFilter === st ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 📚 LISTE DES LIVRES */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-xs">
          {b.currentItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              Aucun livre ne correspond à tes critères de recherche... 🕸️
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {b.currentItems.map((book) => (
                <BookItem
                  key={book.id}
                  book={book}
                  onStatusChange={updateStatus}
                  onOpenDetails={b.handleOpenDetails}
                  onEditClick={(bk) => {
                    setBookToEdit(bk);
                    setIsFormModalOpen(true);
                  }}
                  onDeleteBook={handleDeleteBook}
                />
              ))}
            </div>
          )}
        </div>

        {b.totalPages > 1 && (
          <BookPagination
            currentPage={b.currentPage}
            totalPages={b.totalPages}
            setCurrentPage={b.setCurrentPage}
            filteredAndSortedBooks={b.filteredAndSortedBooks}
          />
        )}

        <BookFormModal
          key={isFormModalOpen ? (bookToEdit?.id ? `edit-${bookToEdit.id}` : 'add') : 'closed'}
          isOpen={isFormModalOpen}
          bookToEdit={bookToEdit}
          onClose={() => {
            setIsFormModalOpen(false);
            setBookToEdit(null);
          }}
          onSuccess={b.fetchBooks}
        />

        {b.selectedBook && (
          <BookDetailsModal
            book={b.selectedBook}
            details={b.bookDetails}
            loading={b.detailsLoading}
            onClose={() => b.setSelectedBook(null)}
          />
        )}
      </div>
    </div>
  );
};
