import { render, screen } from '@testing-library/react';
import { DistributionSection } from './DistributionSection';
import { describe, it, expect, vi } from 'vitest';
import { ReactNode } from 'react';
import { Book, EBookFormat, EBookStatus } from '@/types/books.type';

// Réutilisation de notre mock générique
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => (
    <div className="pie-chart-mock">{children}</div>
  ),
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
  Tooltip: () => null,
}));

describe('DistributionSection', () => {
  const mockBooks: Book[] = [
    {
      id: 'book-123',
      title: 'La Passeuse de Mots',
      author: 'A.J. Twice',
      format: EBookFormat.Papier,
      status: EBookStatus.EnCours,
      is_lc: true,
      saga_name: 'La Passeuse de Mots',
      volume_number: 1,
      added_at: '2026-05-15T10:00:00.000Z',
      thumbnail: 'https://images.com/passeuse.jpg',
      page_count: 250,
    },
  ];

  it('affiche les titres des deux sections de répartition', () => {
    render(<DistributionSection books={mockBooks} />);

    expect(screen.getByText(/Répartition des statuts/i)).toBeDefined();
    expect(screen.getByText(/Répartition par support/i)).toBeDefined();
  });

  it('rend bien les deux graphiques PieChart', () => {
    const { container } = render(<DistributionSection books={mockBooks} />);

    // On vérifie qu'on a bien deux conteneurs de graphique (un pour chaque PieChart)
    const charts = container.querySelectorAll('.pie-chart-mock');
    expect(charts.length).toBe(2);
  });
});
