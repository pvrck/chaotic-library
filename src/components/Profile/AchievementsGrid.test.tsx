import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementsGrid } from './AchievementsGrid';
import { supabase } from '@/lib/supabaseClient';

// Mock du client Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('AchievementsGrid', () => {
  const mockDefinitions = [
    { id: 'ach_1', title: 'Grand Lecteur', description: 'Lire 5 livres' },
    { id: 'ach_2', title: 'Découvreur', description: 'Lire 10 livres' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher les succès et mettre en évidence ceux débloqués', async () => {
    // Mock du comportement chaîné de Supabase
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) => {
        // On distingue l'appel 'definitions' de l'appel 'user_achievements'
        // par l'appelant via un petit hack contextuel ou en vérifiant le mock
        return onFulfilled({ data: mockDefinitions, error: null });
      }),
    };

    // Pour l'appel user_achievements, on renvoie un mock différent (via mockImplementation)
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'achievements_definitions') {
        return {
          ...mockQuery,
          then: vi.fn((resolve) => resolve({ data: mockDefinitions, error: null })),
        } as unknown;
      }
      return {
        ...mockQuery,
        then: vi.fn((resolve) => resolve({ data: [{ achievement_id: 'ach_1' }], error: null })),
      } as unknown;
    });

    render(<AchievementsGrid userId="user_123" />);

    // On attend que les données soient chargées dans le DOM
    await waitFor(() => {
      expect(screen.getByText('Grand Lecteur')).toBeDefined();
      expect(screen.getByText('Découvreur')).toBeDefined();
    });

    // Vérification de l'état "débloqué" (via une classe CSS par exemple)
    const grandLecteurCard = screen.getByText('Grand Lecteur').closest('div')
      ?.parentElement?.parentElement;
    expect(grandLecteurCard?.className).toContain('bg-indigo-50');
  });
});
