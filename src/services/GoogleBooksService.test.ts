import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GoogleBookItem } from '@/types/googleBooks.type';
import { searchGoogleBooks } from './googleBooksService';

describe('searchGoogleBooks', () => {
  // On mocke global.fetch
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  beforeEach(() => {
    vi.clearAllMocks();
    // On simule la variable d'environnement
    import.meta.env.VITE_GOOGLE_BOOKS_API_KEY = 'test_api_key';
  });

  it('devrait retourner une liste de livres en cas de succès', async () => {
    const mockBooks: GoogleBookItem[] = [
      { id: '1', volumeInfo: { title: 'Le Hobbit' } } as GoogleBookItem,
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockBooks }),
    });

    const results = await searchGoogleBooks('Hobbit');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('q=Hobbit'));
    expect(results).toHaveLength(1);
    expect(results[0].volumeInfo.title).toBe('Le Hobbit');
  });

  it('devrait lancer une erreur si la réponse HTTP n’est pas ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(searchGoogleBooks('Inconnu')).rejects.toThrow('Erreur HTTP Google Books: 404');
  });
});
