import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Book, EBookStatus } from '@/types/books.type';
import { BookItem } from '@/components/Books/BookItem';
import { BookSearchBar } from '@/components/Books/BookSearchBar';
import { BookDetailsModal } from '@/components/Books/BookDetailsModal';
import { BookPagination } from '@/components/Books/BookPagination';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useBooks } from '@/hooks/useBooks';

interface UserLibraryTabProps {
  visitedUserId: string;
}

export const UserLibraryTab = ({ visitedUserId }: UserLibraryTabProps) => {
  const { session } = useAuth();
  const [myBookTitles, setMyBookTitles] = useState<string[]>([]);
  const [loadingMyBooks, setLoadingMyBooks] = useState(true);

  // 🌟 On branche TOUTE la logique de l'utilisateur visité sur ton hook magique
  const b = useBooks(visitedUserId);

  // 📦 Chargement de MES livres pour la détection de doublons
  useEffect(() => {
    const fetchMyBooks = async () => {
      if (!session?.user?.id) return;
      try {
        setLoadingMyBooks(true);
        const { data, error } = await supabase
          .from('books')
          .select('title')
          .eq('user_id', session.user.id);

        if (!error && data) {
          setMyBookTitles(data.map((book) => book.title.toLowerCase().trim()));
        }
      } catch (err) {
        console.error('Erreur doublons:', err);
      } finally {
        setLoadingMyBooks(false);
      }
    };

    fetchMyBooks();
  }, [session?.user?.id]);

  // 📅 Fonction utilitaire pour grouper par Mois Année
  const getMonthYearLabel = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  };

  // 🎲 Fonction "Piquer l'idée"
  const handleCopyToMyPal = async (targetBook: Book) => {
    if (!session?.user?.id) return;
    try {
      // 1. Insérer le livre dans ta PAL
      const { error: insertError } = await supabase.from('books').insert({
        user_id: session.user.id,
        title: targetBook.title,
        author: targetBook.author,
        saga_name: targetBook.saga_name,
        saga_id: targetBook.saga_id,
        volume_number: targetBook.volume_number,
        thumbnail: targetBook.thumbnail,
        status: EBookStatus.ALire,
        added_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // 2. Récupérer l'XP actuelle en BDD pour éviter les décalages (sécurité)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const currentXp = profileData?.xp || 0;
      // On retire 10 XP sans descendre sous 0
      const newXp = Math.max(0, currentXp - 10);

      // 3. Appliquer le malus d'ajout via ta fonction RPC magique
      const { error: xpError } = await supabase.rpc('update_xp_with_reason', {
        target_user_id: session.user.id,
        new_xp: newXp,
        log_reason: `Nouveau livre ajouté (Idée piquée) - ${targetBook.title}`,
      });

      if (xpError) throw xpError;

      // 4. Notifications et mise à jour de l'état local
      toast.success(`"${targetBook.title}" a été ajouté à ta PAL ! (-10 XP) 📚`);
      setMyBookTitles((prev) => [...prev, targetBook.title.toLowerCase().trim()]);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout à ta bibliothèque.");
    }
  };

  // On attend que le hook ET mes doublons soient chargés
  if (b.loading || loadingMyBooks) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Détermine si on doit activer l'affichage chronologique par mois pour le membre visité
  const isChronologicalLuView =
    b.statusFilter === EBookStatus.Lu && (b.sortBy === 'added_desc' || b.sortBy === 'added_asc');

  return (
    <div className="space-y-4">
      {/* 🔍 Barre de recherche synchronisée sur le hook */}
      <BookSearchBar
        search={b.search}
        setSearch={b.setSearch}
        formatFilter={b.formatFilter}
        setFormatFilter={b.setFormatFilter}
        sortBy={b.sortBy}
        setSortBy={b.setSortBy}
        setCurrentPage={b.setCurrentPage}
      />

      {/* 📑 Sous-onglets de statuts filtrés du copain */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['Tous', ...Object.values(EBookStatus)] as const).map((st) => {
          const count =
            st === 'Tous' ? b.books.length : b.books.filter((bk) => bk.status === st).length;

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

      {/* 📚 Liste des livres couloir central */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-xs">
        {b.currentItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Aucun livre ne correspond aux critères... 🕸️
          </div>
        ) : isChronologicalLuView ? (
          /* 📅 REGROUPEMENT PAR MOIS CHRONOLOGIQUE DISCRET */
          (() => {
            let currentMonthLabel = '';

            return (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {b.currentItems.map((book) => {
                  const bookMonth = getMonthYearLabel(book.finished_at);
                  const showHeader = bookMonth !== currentMonthLabel;
                  const isAlreadyInMyLibrary = myBookTitles.includes(
                    book.title.toLowerCase().trim()
                  );

                  if (showHeader) {
                    currentMonthLabel = bookMonth;
                  }

                  // Calcul du total mensuel sur l'intégralité de ses livres filtrés
                  const countForThisMonth = b.filteredAndSortedBooks.filter(
                    (bk) => getMonthYearLabel(bk.finished_at) === bookMonth
                  ).length;

                  return (
                    <div key={book.id} className="block">
                      {showHeader && (
                        <div className="bg-slate-50/70 dark:bg-slate-900/40 px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/30">
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {bookMonth}
                          </span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-100/30">
                            {countForThisMonth} {countForThisMonth > 1 ? 'livres lus' : 'livre lu'}
                          </span>
                        </div>
                      )}
                      <BookItem
                        book={book}
                        onOpenDetails={b.handleOpenDetails}
                        isPublicProfile={true}
                        isAlreadyInMyLibrary={isAlreadyInMyLibrary}
                        onCopyToMyPal={handleCopyToMyPal}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          /* 🔤 AFFICHAGE STANDARD EN BLOC CONTINU (Si tri par Titre, Auteur ou Saga) */
          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {b.currentItems.map((book) => {
              const isAlreadyInMyLibrary = myBookTitles.includes(book.title.toLowerCase().trim());
              return (
                <BookItem
                  key={book.id}
                  book={book}
                  onOpenDetails={b.handleOpenDetails}
                  isPublicProfile={true}
                  isAlreadyInMyLibrary={isAlreadyInMyLibrary}
                  onCopyToMyPal={handleCopyToMyPal}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 📑 Pagination */}
      {b.totalPages > 1 && (
        <BookPagination
          currentPage={b.currentPage}
          totalPages={b.totalPages}
          setCurrentPage={b.setCurrentPage}
          filteredAndSortedBooks={b.filteredAndSortedBooks}
        />
      )}

      {/* 🔍 Modale de détails Google Books commune */}
      {b.selectedBook && (
        <BookDetailsModal
          book={b.selectedBook}
          details={b.bookDetails}
          loading={b.detailsLoading}
          onClose={() => b.setSelectedBook(null)}
        />
      )}
    </div>
  );
};
