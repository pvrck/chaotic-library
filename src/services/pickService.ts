import { Book, EBookStatus } from '@/types/books.type';

export interface PickableBook extends Book {
  saga_title?: string;
}

export const getRandomBookFromPAL = (
  allBooks: Book[],
  sagasMap: Record<string, string> // Pour faire correspondre saga_id -> titre_saga facilement
): PickableBook | null => {
  // 1. Isoler les livres qui sont dans la PAL ("À lire")
  const palBooks = allBooks.filter((b) => b.status === EBookStatus.ALire);
  if (palBooks.length === 0) return null;

  // 2. Filtrer les sagas pour ne garder que le TOME SUIVANT logique
  const candidateBooks: PickableBook[] = [];

  // On regroupe tous les livres de l'utilisateur par Saga pour analyser sa progression globale
  const booksBySaga = allBooks.reduce(
    (acc, book) => {
      if (book.saga_id) {
        if (!acc[book.saga_id]) acc[book.saga_id] = [];
        acc[book.saga_id].push(book);
      }
      return acc;
    },
    {} as Record<string, Book[]>
  );

  for (const book of palBooks) {
    if (!book.saga_id) {
      // Livre unique : candidat direct
      candidateBooks.push(book);
    } else {
      // Livre de saga : on vérifie si c'est le plus petit numéro de tome disponible dans la PAL
      const sagaBooks = booksBySaga[book.saga_id];

      // On cherche si l'utilisateur a déjà lu ou est en cours sur des tomes supérieurs,
      // mais le plus simple est de trouver le numéro de tome minimum qui est actuellement "À lire"
      const palTomesForThisSaga = sagaBooks
        .filter((b) => b.status === EBookStatus.ALire)
        .map((b) => b.volume_number || 0);

      const minPalTome = Math.min(...palTomesForThisSaga);

      // Si le livre actuel est bien le "prochain" tome à lire dans la PAL, on le garde
      if (book.volume_number === minPalTome) {
        candidateBooks.push({
          ...book,
          saga_title: sagasMap[book.saga_id] || 'Saga',
        });
      }
    }
  }

  if (candidateBooks.length === 0) return null;

  // 3. Système de pondération par ancienneté (Poids basé sur l'âge en jours)
  const now = new Date().getTime();
  let totalWeight = 0;

  const booksWithWeights = candidateBooks.map((book) => {
    const createdDate = new Date(book.added_at || now).getTime();
    const ageInDays = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));

    // Le poids est proportionnel à l'âge (ex: un livre là depuis 100 jours a 100x plus de chances qu'un livre d'1 jour)
    const weight = ageInDays;
    totalWeight += weight;

    return { book, weight };
  });

  // 4. Tirage au sort pondéré
  let randomPicker = Math.random() * totalWeight;

  for (const item of booksWithWeights) {
    randomPicker -= item.weight;
    if (randomPicker <= 0) {
      return item.book;
    }
  }

  return booksWithWeights[0].book;
};
