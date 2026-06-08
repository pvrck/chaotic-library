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
    vi.mocked(useBooks).mockReturnValue({
      loading: false,
      currentItems: [],
      // On remplit le minimum requis par l'interface du hook
      books: [],
      totalPages: 0,
      currentPage: 1,
      fetchBooks: vi.fn(),
    } as unknown as UseBooksReturn);

    render(<BooksPage />);

    const addBtn = screen.getByText(/Ajouter un livre/i);

    await act(async () => {
      fireEvent.click(addBtn);
    });

    const modal = await screen.findByTestId('form-modal');
    expect(modal).toBeInTheDocument();
  });
});
