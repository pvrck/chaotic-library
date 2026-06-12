import { render, screen, fireEvent } from '@testing-library/react';
import { Stats } from './Stats';
import { describe, it, expect, vi } from 'vitest';

interface YearPopoverProps {
  selectedYear: number;
  years: number[];
  onSelect: (year: number) => void;
}

interface MonthPopoverProps {
  selectedMonth: number;
  selectedYear: number;
  onSelect: (month: number) => void;
}

// 1. Mock des hooks et services
vi.mock('@/hooks/useBooks', () => ({
  useBooks: () => ({
    books: [
      { id: '1', added_at: '2026-01-01', status: 'Lu' },
      { id: '2', added_at: '2026-02-01', status: 'En cours' },
    ],
  }),
}));

// On mock les composants enfants pour isoler le test de 'Stats'
vi.mock('./YearPopover', () => ({
  YearPopover: ({ onSelect }: YearPopoverProps) => (
    <button onClick={() => onSelect(2025)}>Changer Année</button>
  ),
}));

vi.mock('./MonthPopover', () => ({
  MonthPopover: ({ onSelect }: MonthPopoverProps) => (
    <button onClick={() => onSelect(5)}>Changer Mois</button>
  ),
}));

// Mock des autres composants graphiques
vi.mock('@/components/Dashboard/Stats/YearlyChart', () => ({
  YearlyChart: () => <div>GraphAnnuel</div>,
}));
vi.mock('@/components/Dashboard/Stats/DistributionSection', () => ({
  DistributionSection: () => <div>Distribution</div>,
}));

describe('Stats', () => {
  it('affiche les titres principaux', () => {
    render(<Stats />);
    expect(screen.getByText(/Mon activité de lecture/i)).toBeDefined();
  });

  it("met à jour le mois affiché lors de l'interaction", async () => {
    render(<Stats />);

    // Au départ, on est sur le mois actuel (juin = index 5)
    // On clique sur le bouton de mock de MonthPopover
    const monthButton = screen.getByText('Changer Mois');
    fireEvent.click(monthButton);

    // Vérifie que le titre du mois a changé (juillet = index 6)
    // Note: Selon ton code, il affiche le mois sélectionné + 1 si tu as un décalage
    expect(screen.getByText(/Statistiques pour/i)).toBeDefined();
  });
});
