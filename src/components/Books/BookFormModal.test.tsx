import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookFormModal from './BookFormModal';
import { EBookFormat, EBookStatus, Book } from '@/types/books.type';

// 🔮 1. MOCK DE SUPABASE
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'books') return { insert: mockInsert, update: mockUpdate };
      return {};
    }),
  },
}));

// 🔑 2. MOCK DU CONTEXTE D'AUTH
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-456' },
  }),
}));

// 🌍 3. MOCK DU SERVICE GOOGLE BOOKS
const mockSearchGoogleBooks = vi.fn<(query: string, maxResults?: number) => Promise<unknown[]>>(
  () =>
    Promise.resolve([
      {
        volumeInfo: {
          title: 'Changer l’eau des fleurs',
          authors: ['Valérie Perrin'],
          industryIdentifiers: [{ type: 'ISBN_13', identifier: '9782253237570' }],
          imageLinks: { smallThumbnail: 'https://images.com/fleurs.jpg' },
        },
      },
    ])
);

vi.mock('@/services/googleBooksService', () => ({
  searchGoogleBooks: (query: string, maxResults?: number) =>
    mockSearchGoogleBooks(query, maxResults),
}));

describe('Component - BookFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Le modal est fermé
  it('ne devrait rien afficher si isOpen est false', () => {
    const { container } = render(
      <BookFormModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  // 🧪 Test 2 : Mode création + Recherche API Google Books
  it('devrait permettre de chercher un livre via Google Books et pré-remplir les champs', async () => {
    render(<BookFormModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Ajouter une relique')).toBeInTheDocument();

    // 1. Simuler la saisie dans le champ de recherche Google Books
    const searchInput = screen.getByPlaceholderText(/Titre ou ISBN.../i);
    fireEvent.change(searchInput, { target: { value: 'Valérie Perrin' } });

    // 2. Cliquer sur le bouton "Chercher"
    const searchButton = screen.getByRole('button', { name: 'Chercher' });
    fireEvent.click(searchButton);

    // 3. Attendre que la suggestion apparaisse à l'écran
    await waitFor(() => {
      expect(mockSearchGoogleBooks).toHaveBeenCalledWith('Valérie Perrin', 5);
      expect(screen.getByText('Changer l’eau des fleurs')).toBeInTheDocument();
    });

    // 4. Sélectionner la suggestion
    const suggestionButton = screen.getByRole('button', { name: /Changer l’eau des fleurs/i });
    fireEvent.click(suggestionButton);

    // 5. Vérifier que les inputs principaux du formulaire se sont bien mis à jour
    const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
    const authorInput = screen.getByLabelText('Auteur(s)') as HTMLInputElement;

    expect(titleInput.value).toBe('Changer l’eau des fleurs');
    expect(authorInput.value).toBe('Valérie Perrin');
  });

  // 🧪 Test 3 : Soumission du formulaire en mode Création
  it('devrait insérer un nouveau livre dans Supabase à la soumission', async () => {
    render(<BookFormModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Remplir manuellement les champs requis
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Elantris' } });
    fireEvent.change(screen.getByLabelText('Auteur(s)'), {
      target: { value: 'Brandon Sanderson' },
    });

    // Soumettre le formulaire
    const submitButton = screen.getByRole('button', { name: 'Sauvegarder' });
    fireEvent.submit(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Elantris',
            author: 'Brandon Sanderson',
            user_id: 'user-456',
          }),
        ])
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // 🧪 Test 4 : Mode Édition
  it('devrait pré-remplir les champs avec bookToEdit et appeler update à la soumission', async () => {
    const bookToEdit = {
      id: 'book-exist-123',
      title: 'Chronique du Tueur de Roi',
      author: 'Patrick Rothfuss',
      format: EBookFormat.Papier,
      status: EBookStatus.EnCours,
      is_lc: false,
      added_at: '2026-06-01T00:00:00.000Z',
    } as unknown as Book;

    render(
      <BookFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        bookToEdit={bookToEdit}
      />
    );

    expect(screen.getByText('Modifier la relique')).toBeInTheDocument();

    // Vérifier que les valeurs du livre à éditer sont dans les inputs
    const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
    expect(titleInput.value).toBe('Chronique du Tueur de Roi');

    // Soumettre le formulaire de modification
    const submitButton = screen.getByRole('button', { name: 'Sauvegarder' });
    fireEvent.submit(submitButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
