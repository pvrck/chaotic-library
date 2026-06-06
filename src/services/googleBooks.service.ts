import { GoogleBookItem } from '@/types/googleBooks.type';

/**
 * Lance une recherche brute sur l'API Google Books
 * @param query La chaîne de recherche (ex: "isbn:123" ou "Le Hobbit Tolkien")
 * @param maxResults Le nombre maximum de résultats souhaités
 */
export const searchGoogleBooks = async (
  query: string,
  maxResults: number = 10
): Promise<GoogleBookItem[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

  if (!apiKey) {
    throw new Error('La clé VITE_GOOGLE_BOOKS_API_KEY est manquante dans votre fichier .env');
  }

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur HTTP Google Books: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
};
