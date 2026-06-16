import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { XpHistoryPage } from './XpHistoryPage';

// 1. Mock de Supabase
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockRange = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
    })),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'user-123' } }),
}));

describe('Page - XpHistoryPage', () => {
  it('devrait charger et afficher les logs', async () => {
    const mockLogs = [{ id: '1', amount: 50, reason: 'Test', created_at: '2026-06-16T10:00:00Z' }];
    mockRange.mockResolvedValue({ data: mockLogs, error: null });

    render(<XpHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('+50 XP')).toBeInTheDocument();
    });
  });

  it('devrait changer de page au clic sur Suivant', async () => {
    // 1. Setup : Mock des réponses pour les 2 appels successifs
    // Page 0 : on renvoie 10 éléments pour que le bouton soit activé
    mockRange
      .mockResolvedValueOnce({ data: Array(10).fill({ id: '1', amount: 10 }), error: null })
      // Page 1 : on renvoie un tableau vide pour la page suivante
      .mockResolvedValueOnce({ data: [], error: null });

    render(<XpHistoryPage />);

    // 2. Attend le rendu initial (page 0)
    await waitFor(() => expect(mockRange).toHaveBeenCalledWith(0, 9));

    // 3. Simule le clic (maintenant le bouton est bien actif car logs.length === 10)
    const nextButton = screen.getByRole('button', { name: /suivant/i });
    fireEvent.click(nextButton);

    // 4. Attend l'appel de la page 1 (10, 19)
    await waitFor(() => {
      expect(mockRange).toHaveBeenLastCalledWith(10, 19);
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument();
    });
  });
});
