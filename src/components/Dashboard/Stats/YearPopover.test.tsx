import { render, screen, fireEvent } from '@testing-library/react';
import { YearPopover } from './YearPopover';
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

describe('YearPopover', () => {
  const years = [2024, 2025, 2026];
  const mockOnSelect = vi.fn();

  it("devrait afficher l'année sélectionnée dans le bouton", () => {
    render(<YearPopover years={years} selectedYear={2026} onSelect={mockOnSelect} />);

    expect(screen.getByText('2026 ▼')).toBeDefined();
  });

  it('devrait appeler onSelect avec la bonne année lors du clic', async () => {
    render(<YearPopover years={years} selectedYear={2026} onSelect={mockOnSelect} />);

    // 1. On ouvre le menu (clic sur le bouton)
    const button = screen.getByText('2026 ▼');
    fireEvent.click(button);

    // 2. On cherche le bouton "2024" dans la liste et on clique dessus
    const option = screen.getByText('2024');
    fireEvent.click(option);

    // 3. On vérifie que onSelect a bien été appelé avec 2024
    expect(mockOnSelect).toHaveBeenCalledWith(2024);
  });
});
