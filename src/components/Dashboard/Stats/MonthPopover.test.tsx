import { render, screen, fireEvent } from '@testing-library/react';
import { MonthPopover } from './MonthPopover';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('MonthPopover', () => {
  const mockOnSelect = vi.fn();

  it('affiche le mois sélectionné', () => {
    render(<MonthPopover selectedMonth={0} selectedYear={2026} onSelect={mockOnSelect} />);
    expect(screen.getByText('Janvier ▼')).toBeDefined();
  });

  it("affiche tous les mois si l'année est antérieure à l'année en cours", async () => {
    // Année 2025 (on est en 2026) -> doit afficher les 12 mois
    render(<MonthPopover selectedMonth={0} selectedYear={2025} onSelect={mockOnSelect} />);

    const button = screen.getByText('Janvier ▼');
    fireEvent.click(button);

    const decembre = await screen.findByText('Décembre');
    expect(decembre).toBeDefined();
  });

  it('appelle onSelect avec le bon index lors du clic', async () => {
    render(<MonthPopover selectedMonth={0} selectedYear={2026} onSelect={mockOnSelect} />);

    const button = screen.getByText('Janvier ▼');
    fireEvent.click(button);

    const mars = await screen.findByText('Mars');
    fireEvent.click(mars);

    expect(mockOnSelect).toHaveBeenCalledWith(2); // Mars est l'index 2
  });
});
