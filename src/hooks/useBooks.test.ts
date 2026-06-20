import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBooks } from './useBooks';
import { searchGoogleBooks } from '@/services/googleBooksService';
import { Book, EBookFormat, EBookStatus } from '@/types/books.type';
import { GoogleBookItem } from '@/types/googleBooks.type';

// 🔮 1. MOCK DE SUPABASE
const mockSelect = vi.fn();
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => mockSelect(),
    })),
  },
}));

// 🔮 2. MOCK DU SERVICE GOOGLE BOOKS
vi.mock('@/services/googleBooksService', () => ({
  searchGoogleBooks: vi.fn(),
}));

describe('Hook - useBooks', () => {
  // Jeu de données de test (Livres et Sagas)
  const mockBooksList: Book[] = [
    {
      id: '1',
      title: 'La Passeuse de Mots',
      author: 'AJ Twice',
      saga_name: 'La Passeuse de Mots',
      status: EBookStatus.EnCours,
      format: EBookFormat.Papier,
      added_at: '2026-05-01',
      is_lc: true,
      page_count: 240,
    },
    {
      id: '2',
      title: 'A Touch of Darkness',
      author: 'Scarlett St. Clair',
      saga_name: null,
      status: EBookStatus.ALire,
      format: EBookFormat.Numerique,
      added_at: '2026-06-01',
      is_lc: false,
      page_count: 125,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Chargement initial des données via le useEffect
  it('devrait charger la liste des livres au montage', async () => {
    mockSelect.mockResolvedValueOnce({ data: mockBooksList, error: null });

    const { result } = renderHook(() => useBooks());

    // Au tout début, c'est en cours de chargement
    expect(result.current.loading).toBe(true);

    // On attend la résolution du useEffect
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.books).toHaveLength(2);
      expect(result.current.filteredAndSortedBooks).toHaveLength(2);
    });
  });

  // 🧪 Test 2 : Moteur de recherche et filtres combinés
  it('devrait filtrer les livres par texte (titre ou auteur)', async () => {
    mockSelect.mockResolvedValueOnce({ data: mockBooksList, error: null });
    const { result } = renderHook(() => useBooks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // On change la valeur de recherche (attention à bien englober dans act() car on modifie l'état !)
    act(() => {
      result.current.setSearch('Twice');
    });

    // Seul le livre d'AJ Twice doit ressortir
    expect(result.current.filteredAndSortedBooks).toHaveLength(1);
    expect(result.current.filteredAndSortedBooks[0].title).toBe('La Passeuse de Mots');
  });

  // 🧪 Test 3 : Filtrage par statut de lecture
  it('devrait filtrer les livres selon leur statut', async () => {
    mockSelect.mockResolvedValueOnce({ data: mockBooksList, error: null });
    const { result } = renderHook(() => useBooks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setStatusFilter(EBookStatus.ALire);
    });

    expect(result.current.filteredAndSortedBooks).toHaveLength(1);
    expect(result.current.filteredAndSortedBooks[0].title).toBe('A Touch of Darkness');
  });

  // 🧪 Test 4 : Récupération des détails via Google Books API
  it('devrait appeler l’API Google Books et alimenter les détails du livre sélectionné', async () => {
    mockSelect.mockResolvedValueOnce({ data: mockBooksList, error: null });

    // Mock de la réponse du service Google Books
    const mockGoogleBooksResponse = [
      {
        id: 'mock-book-id',
        kind: 'books#volume',
        etag: 'mock-etag',
        selfLink: 'https://www.googleapis.com/books/v1/volumes/mock-book-id',
        volumeInfo: {
          description: 'Un roman fantasy captivant...',
          pageCount: 736,
          publishedDate: '2021',
          categories: ['Fantasy'],
          imageLinks: { thumbnail: 'http://image-link.com/cover.jpg' },
        },
      },
    ];
    vi.mocked(searchGoogleBooks).mockResolvedValueOnce(
      mockGoogleBooksResponse as unknown as GoogleBookItem[]
    );

    const { result } = renderHook(() => useBooks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // On déclenche l'ouverture des détails pour le premier livre
    await act(async () => {
      await result.current.handleOpenDetails(mockBooksList[0]);
    });

    // On vérifie que les states du détails ont été correctement mis à jour
    expect(result.current.selectedBook).toEqual(mockBooksList[0]);
    expect(result.current.bookDetails).toEqual({
      description: 'Un roman fantasy captivant...',
      pageCount: 736,
      publishedDate: '2021',
      categories: ['Fantasy'],
      image: 'http://image-link.com/cover.jpg',
    });
    expect(result.current.detailsLoading).toBe(false);
  });
});
