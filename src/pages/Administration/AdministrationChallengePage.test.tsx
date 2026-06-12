import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, Mock } from 'vitest';
import { AdministrationChallengePage } from './AdministrationChallengePage';
import { supabase } from '@/lib/supabaseClient';
import { Dispatch, SetStateAction } from 'react';
import { ChallengePoolItem } from '@/types/challenges.type';

interface AdminChallengeProps {
  challenges: ChallengePoolItem[];
  setRefreshTrigger: Dispatch<SetStateAction<number>>;
}

// On mocke Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// On mocke le composant enfant pour isoler la page
vi.mock('@/components/Administration/AdminChallenge', () => ({
  // On typage explicitement les props ici
  AdminChallenge: ({ setRefreshTrigger }: AdminChallengeProps) => (
    <button onClick={() => setRefreshTrigger((prev) => prev + 1)}>Refresh</button>
  ),
}));

describe('AdministrationChallengePage', () => {
  it('affiche le loader au chargement', () => {
    render(<AdministrationChallengePage />);
    expect(screen.getByRole('status') || document.querySelector('.animate-spin')).toBeDefined();
  });

  it('charge et affiche les données après le montage', async () => {
    render(<AdministrationChallengePage />);

    // Vérifie que Supabase a bien été appelé
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('challenge_pool');
    });
  });

  it('recharge les données quand le trigger change', async () => {
    render(<AdministrationChallengePage />);

    // 1. On attend que le chargement initial soit fini
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });

    // 2. On capture le nombre d'appels actuels (peu importe s'il y en a 1 ou 2)
    const initialCalls = (supabase.from as Mock).mock.calls.length;

    // 3. Simule le clic sur le bouton de "Refresh"
    const refreshBtn = screen.getByText('Refresh');
    refreshBtn.click();

    // 4. Vérifie que le nombre total d'appels a augmenté
    await waitFor(() => {
      expect((supabase.from as Mock).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
