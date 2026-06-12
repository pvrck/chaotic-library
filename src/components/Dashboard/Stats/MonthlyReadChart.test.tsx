import { render, screen } from '@testing-library/react';
import { MonthlyReadChart } from './MonthlyReadChart';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ReactNode } from 'react';

// Réutilisation du mock générique pour Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div className="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => (
    <div className="bar-chart-mock">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('MonthlyReadChart', () => {
  const mockData = [
    { name: 'Jan', count: 2 },
    { name: 'Fév', count: 5 },
  ];

  it('affiche correctement le titre du graphique', () => {
    render(<MonthlyReadChart data={mockData} />);
    expect(screen.getByText(/Livres lus par mois/i)).toBeDefined();
  });

  it('rend bien le conteneur du bar chart', () => {
    const { container } = render(<MonthlyReadChart data={mockData} />);
    const chart = container.querySelector('.bar-chart-mock');
    expect(chart).not.toBeNull();
  });
});
