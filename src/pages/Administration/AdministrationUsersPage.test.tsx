import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, type Mock } from 'vitest';
import { AdministrationUsersPage } from './AdministrationUsersPage';
import { supabase } from '@/lib/supabaseClient';
import { Dispatch, SetStateAction } from 'react';
import { Level } from '@/types/levels.type';
import { Profile } from '@/types/users.type';

interface AdminUsersProps {
  users: Profile[];
  levels: Level[];
  setRefreshTrigger: Dispatch<SetStateAction<number>>;
}

// On mocke Supabase pour qu'il réponde aux deux tables
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: table === 'profiles' ? [] : [],
        error: null,
      }),
    })),
  },
}));

vi.mock('@/components/Administration/AdminUsers', () => ({
  AdminUsers: ({ setRefreshTrigger }: AdminUsersProps) => (
    <button onClick={() => setRefreshTrigger((prev: number) => prev + 1)}>Refresh</button>
  ),
}));

describe('AdministrationUsersPage', () => {
  it('charge les deux tables nécessaires', async () => {
    render(<AdministrationUsersPage />);

    await waitFor(() => {
      // Vérifie que les deux appels ont été effectués
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('levels_config');
    });
  });

  it('recharge les données quand le trigger change', async () => {
    render(<AdministrationUsersPage />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });

    const initialCalls = (supabase.from as Mock).mock.calls.length;
    const refreshBtn = screen.getByText('Refresh');
    refreshBtn.click();

    await waitFor(() => {
      // On vérifie que le nombre d'appels a augmenté (il devrait augmenter de 2 d'un coup)
      expect((supabase.from as Mock).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
