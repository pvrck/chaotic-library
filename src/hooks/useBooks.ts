import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { searchGoogleBooks } from '@/services/googleBooksService';
import { Book, BookDetails, EBookStatus, BookFormat } from '@/types/books.type';
import { SortOption } from '@/types/filters.type';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [bookDetails, setBookDetails] = useState<BookDetails>();

  // Filtres, recherche, tris & pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EBookStatus | 'Tous'>('Tous');
  const [formatFilter, setFormatFilter] = useState<BookFormat | 'Tous'>('Tous');
  const [sortBy, setSortBy] = useState<SortOption>('added_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (error) throw error;
      setBooks((data as Book[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const { data, error } = await supabase.from('books').select('*');
        if (error) throw error;

        // On vérifie que le composant est toujours affiché avant de changer l'état
        if (isMounted) {
          setBooks((data as Book[]) || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    // Fonction de nettoyage (clean-up) si l'utilisateur quitte la page rapidement
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenDetails = async (book: Book) => {
    setSelectedBook(book);
    setDetailsLoading(true);
    setBookDetails(undefined);

    try {
      const query = `${book.title} ${book.author}`;
      const items = await searchGoogleBooks(query, 1);

      if (items.length > 0) {
        const volume = items[0].volumeInfo;
        setBookDetails({
          description: volume.description || null,
          pageCount: volume.pageCount,
          publishedDate: volume.publishedDate,
          categories: volume.categories,
          image: volume.imageLinks?.thumbnail,
        });
      }
    } catch (err) {
      console.error('Erreur détails Google Books:', err);
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
        !!(book.saga_name && book.saga_name.toLowerCase().includes(search.toLowerCase()));
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

  const totalPages = Math.ceil(filteredAndSortedBooks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedBooks.slice(indexOfFirstItem, indexOfLastItem);

  return {
    books,
    setBooks,
    loading,
    fetchBooks,
    selectedBook,
    setSelectedBook,
    detailsLoading,
    bookDetails,
    handleOpenDetails,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    formatFilter,
    setFormatFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    currentItems,
    filteredAndSortedBooks,
  };
};
