import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementsGrid } from './AchievementsGrid';
import { supabase } from '@/lib/supabaseClient';

interface MockQueryBuilder {
  select: () => MockQueryBuilder;
  eq: () => MockQueryBuilder;
  order: () => MockQueryBuilder;
  then: (onFulfilled: (value: unknown) => unknown) => unknown;
}

// Mock du client Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('AchievementsGrid', () => {
  const mockDefinitions = [
    {
      id: 'ach_1',
      title: 'Grand Lecteur',
      description: 'Lire 5 livres',
      condition_type: 'classique',
    },
    {
      id: 'ach_2',
      title: 'Découvreur',
      description: 'Lire 10 livres',
      condition_type: 'classique',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher les succès et mettre en évidence ceux débloqués', async () => {
    const mockQuery: MockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled) => {
        return onFulfilled({ data: mockDefinitions, error: null });
      }),
    };

    // On transtype la fonction entière via 'as unknown as' pour respecter la signature de Supabase
    vi.mocked(supabase.from).mockImplementation(((table: string): unknown => {
      if (table === 'achievements_definitions') {
        return {
          ...mockQuery,
          then: vi.fn((resolve) => resolve({ data: mockDefinitions, error: null })),
        };
      }
      if (table === 'user_goals') {
        return {
          ...mockQuery,
          then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };
      }
      return {
        ...mockQuery,
        then: vi.fn((resolve) =>
          resolve({
            data: [{ achievement_id: 'ach_1', unlocked_at: '2026-05-01T00:00:00Z' }],
            error: null,
          })
        ),
      };
    }) as unknown as typeof supabase.from); // <-- Le double cast magique est ici !

    render(<AchievementsGrid userId="user_123" />);

    // On attend que les données soient chargées dans le DOM
    await waitFor(() => {
      expect(screen.getByText('Grand Lecteur')).toBeDefined();
      expect(screen.getByText('Découvreur')).toBeDefined();
    });

    // Vérification de l'état "débloqué"
    const grandLecteurCard = screen.getByText('Grand Lecteur').closest('div')
      ?.parentElement?.parentElement;
    expect(grandLecteurCard?.className).toContain('bg-indigo-50');
  });
});
