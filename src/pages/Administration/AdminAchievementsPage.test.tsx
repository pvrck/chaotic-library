import { supabase } from '@/lib/supabaseClient';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAchievementsPage } from './AdminAchievementsPage';

// Mock minimaliste du Query Builder
const createMockQuery = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
});

describe('AdminAchievementsPage', () => {
  const mockQuery = createMockQuery();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabase, 'from').mockReturnValue(
      mockQuery as unknown as ReturnType<typeof supabase.from>
    );
  });

  it('devrait afficher le formulaire et charger les succès', async () => {
    render(<AdminAchievementsPage />);

    // Vérifier que le formulaire est présent
    expect(screen.getByLabelText(/Titre/i)).toBeDefined();

    // Vérifier que fetch a été appelé
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('achievements_definitions');
    });
  });

  it('devrait appeler insert lors de la création', async () => {
    const user = userEvent.setup(); // Initialise userEvent
    render(<AdminAchievementsPage />);

    // 1. Remplissage avec userEvent
    await user.type(screen.getByLabelText(/Titre/i), 'Nouveau Succès');
    await user.type(screen.getByLabelText(/Description/i), 'Ma description');
    await user.type(screen.getByLabelText(/Seuil/i), '10');
    await user.type(screen.getByLabelText(/XP Bonus/i), '50');

    // Pour le select, utilise user.selectOptions
    await user.selectOptions(screen.getByLabelText(/Condition/i), 'livres_lus');

    // 2. Soumission
    await user.click(screen.getByRole('button', { name: /Ajouter le succès/i }));

    // 3. Vérification
    await waitFor(() => {
      expect(mockQuery.insert).toHaveBeenCalled();
    });
  });
});
