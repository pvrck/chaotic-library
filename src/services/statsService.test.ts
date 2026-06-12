import { Book, EBookStatus } from '@/types/books.type';
import { describe, expect, test } from 'vitest';
import { getMonthlySnapshot, getYearlyEvolutionStats } from './statsService';

describe('statsService', () => {
  const mockBooks: Book[] = [
    // Livre ajouté l'an dernier (doit impacter le total initial de 2026)
    { id: '1', added_at: '2025-12-01', status: EBookStatus.ALire } as Book,
    // Livre ajouté en Janvier 2026
    { id: '2', added_at: '2026-01-15', status: EBookStatus.ALire } as Book,
    // Livre lu en Février 2026
    { id: '3', added_at: '2026-02-01', status: EBookStatus.Lu, finished_at: '2026-02-15' } as Book,
  ];

  test('getYearlyEvolutionStats doit inclure le stock des années précédentes', () => {
    const stats = getYearlyEvolutionStats(mockBooks, 2026);

    // Janvier : total = 1 (existant) + 1 (ajouté) = 2
    expect(stats[0].total).toBe(2);
    // Janvier : lus = 0 (repart à zéro)
    expect(stats[0].lus).toBe(0);
  });

  test("getYearlyEvolutionStats doit cumuler les lectures de l'année en cours", () => {
    const stats = getYearlyEvolutionStats(mockBooks, 2026);

    // Février : lus = 1 (celui du 15 février)
    expect(stats[1].lus).toBe(1);
    // Mars : le compteur de lus doit rester à 1 (pas de nouveau livre lu)
    expect(stats[2].lus).toBe(1);
  });

  test('getMonthlySnapshot doit calculer correctement la PAL', () => {
    // Snapshot à fin février 2026
    const snapshot = getMonthlySnapshot(mockBooks, 2026, 1); // 1 = février

    // Total = 1 (2025) + 1 (jan) + 1 (fév) = 3
    expect(snapshot.total).toBe(3);
    // PAL = 3 - 1 (lu) - 0 (abandonné) = 2
    expect(snapshot.pal).toBe(2);
  });

  test('getYearlyEvolutionStats doit gérer correctement un livre ajouté et lu la même année', () => {
    const books: Book[] = [
      {
        id: '4',
        added_at: '2026-03-10',
        status: EBookStatus.Lu,
        finished_at: '2026-03-25',
      } as Book,
    ];

    const stats = getYearlyEvolutionStats(books, 2026);

    // Mars (index 2)
    const mars = stats[2];

    // Total doit avoir augmenté de 1
    expect(mars.total).toBe(1);
    // Lus doit avoir augmenté de 1
    expect(mars.lus).toBe(1);
    // Abandonnés doit être à 0
    expect(mars.abandonnes).toBe(0);
  });
});
