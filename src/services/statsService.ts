import { Book, EBookFormat, EBookStatus } from '@/types/books.type';

export const getYearlyEvolutionStats = (books: Book[], year: number) => {
  // 1. Calcul du solde initial du STOCK (pour que la courbe de bibliothèque ne reparte pas de 0)
  const previousYear = year - 1;
  const initialTotal = books.filter(
    (b) => new Date(b.added_at).getFullYear() <= previousYear
  ).length;

  let runningTotal = initialTotal;
  let runningLus = 0; // On repart à 0 pour l'année
  let runningAbandonnes = 0; // On repart à 0 pour l'année

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i).toLocaleString('fr-FR', { month: 'short' }),
    total: 0,
    lus: 0,
    abandonnes: 0,
  }));

  months.forEach((m, index) => {
    const booksAdded = books.filter((b) => {
      const d = new Date(b.added_at);
      return d.getMonth() === index && d.getFullYear() === year;
    });
    const booksFinished = books.filter((b) => {
      const d = b.finished_at ? new Date(b.finished_at) : null;
      return b.status === EBookStatus.Lu && d?.getMonth() === index && d?.getFullYear() === year;
    });
    const booksAbandoned = books.filter((b) => {
      const d = new Date(b.added_at);
      return b.status === 'Abandonné' && d.getMonth() === index && d.getFullYear() === year;
    });

    runningTotal += booksAdded.length;
    runningLus += booksFinished.length;
    runningAbandonnes += booksAbandoned.length;

    m.total = runningTotal;
    m.lus = runningLus;
    m.abandonnes = runningAbandonnes;
  });

  return months;
};

export const getMonthlySnapshot = (books: Book[], year: number, month: number) => {
  const booksUpToMonth = books.filter((b) => {
    const d = new Date(b.added_at);
    return d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() <= month);
  });

  const lus = booksUpToMonth.filter(
    (b) =>
      b.status === EBookStatus.Lu && b.finished_at && new Date(b.finished_at).getMonth() <= month
  ).length;
  const abandonnes = booksUpToMonth.filter((b) => b.status === 'Abandonné').length;

  // Nouveauté : livres ajoutés SPÉCIFIQUEMENT ce mois-ci
  const ajoutesCeMois = books.filter((b) => {
    const d = new Date(b.added_at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const totalBibliotheque = booksUpToMonth.length;
  const pal = totalBibliotheque - lus - abandonnes;

  return { total: totalBibliotheque, lus, pal, abandonnes, ajoutesCeMois };
};

export const getLibraryDistribution = (books: Book[]) => {
  const statusCounts = books.reduce(
    (acc, book) => {
      acc[book.status] = (acc[book.status] || 0) + 1;
      return acc;
    },
    {} as Record<EBookStatus, number>
  );

  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

export const getFormatDistribution = (books: Book[]) => {
  const counts = books.reduce(
    (acc, book) => {
      // Si format n'est pas défini, on met 'Inconnu'
      const format = book.format || 'Inconnu';
      acc[format] = (acc[format] || 0) + 1;
      return acc;
    },
    {} as Record<EBookFormat, number>
  );

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};
