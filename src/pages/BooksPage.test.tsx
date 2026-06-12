import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BooksPage } from './BooksPage';
import { useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/context/AuthContext';

// 1. Définition des types basés sur les hooks réels
type UseBooksReturn = ReturnType<typeof useBooks>;
type UseAuthReturn = ReturnType<typeof useAuth>;

// 2. Mocks des modules
vi.mock('@/hooks/useBooks', () => ({ useBooks: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));

// 3. Mock du composant modale pour le test
vi.mock('@/components/Books/BookFormModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="form-modal">Formulaire</div> : null,
}));

describe('Page - BooksPage', () => {
  it('devrait ouvrir la modale d’ajout lors du clic sur le bouton', async () => {
    // Mock typé pour Auth (en ne gardant que ce dont le composant a besoin)
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      profile: { role: 'user' },
    } as UseAuthReturn);

    // Mock typé pour useBooks
    // Dans ton test "affiche le bon nombre de livres dans le badge"
    vi.mocked(useBooks).mockReturnValue({
      loading: false,
      currentItems: [{ id: '1' }, { id: '2' }], // Les éléments à afficher
      books: [{ id: '1' }, { id: '2' }], // La liste totale
      filteredAndSortedBooks: [{ id: '1' }, { id: '2' }],
      statusFilter: 'Tous',
      setStatusFilter: vi.fn(),
      sortBy: 'date',
      setSortBy: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      formatFilter: 'Tous',
      setFormatFilter: vi.fn(),
      totalPages: 1,
      currentPage: 1,
      setCurrentPage: vi.fn(),
      fetchBooks: vi.fn(),
      handleOpenDetails: vi.fn(),
      selectedBook: null,
      setSelectedBook: vi.fn(),
      bookDetails: null,
      detailsLoading: false,
    } as unknown as UseBooksReturn);

    render(<BooksPage />);

    const addBtn = screen.getByText(/Ajouter un livre/i);

    await act(async () => {
      fireEvent.click(addBtn);
    });

    const modal = await screen.findByTestId('form-modal');
    expect(modal).toBeInTheDocument();
  });

  it('affiche le bon nombre de livres dans le badge', () => {
    vi.mocked(useBooks).mockReturnValue({
      loading: false,
      currentItems: [{ id: '1' }, { id: '2' }], // Les éléments à afficher
      books: [{ id: '1' }, { id: '2' }], // La liste totale
      filteredAndSortedBooks: [{ id: '1' }, { id: '2' }],
      statusFilter: 'Tous',
      setStatusFilter: vi.fn(),
      sortBy: 'date',
      setSortBy: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      formatFilter: 'Tous',
      setFormatFilter: vi.fn(),
      totalPages: 1,
      currentPage: 1,
      setCurrentPage: vi.fn(),
      fetchBooks: vi.fn(),
      handleOpenDetails: vi.fn(),
      selectedBook: null,
      setSelectedBook: vi.fn(),
      bookDetails: null,
      detailsLoading: false,
    } as unknown as UseBooksReturn);

    render(<BooksPage />);

    // Vérifie que le compteur "2" est présent
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
