import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { YearlyChart } from './YearlyChart';

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div className="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: ReactNode }) => (
      <div className="line-chart-mock">{children}</div>
    ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

beforeAll(() => {
  // Mock ResizeObserver comme avant
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver);

  // Forcer la taille pour que ResponsiveContainer puisse calculer une taille
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 300 });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('YearlyChart', () => {
  const mockData = [
    { month: 'Jan', total: 10, lus: 2, abandonnes: 0 },
    { month: 'Fév', total: 12, lus: 4, abandonnes: 1 },
  ];

  it('affiche le titre du graphique', () => {
    render(<YearlyChart data={mockData} />);
    expect(screen.getByText(/Progression Annuelle/i)).toBeDefined();
  });

  it('rend bien les conteneurs du graphique', async () => {
    const { container } = render(<YearlyChart data={mockData} />);

    // On vérifie que notre mock de graphique est bien présent
    const mockChart = container.querySelector('.line-chart-mock');
    expect(mockChart).not.toBeNull();
  });
});
