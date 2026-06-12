import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, type Mock } from 'vitest';
import { AdministrationLevelsPage } from './AdministrationLevelsPage';
import { supabase } from '@/lib/supabaseClient';
import { Dispatch, SetStateAction } from 'react';
import { Level } from '@/types/levels.type';

interface AdminLevelsProps {
  levels: Level[];
  setRefreshTrigger: Dispatch<SetStateAction<number>>;
}

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock du composant enfant AdminLevels
vi.mock('@/components/Administration/AdminLevels', () => ({
  AdminLevels: ({ setRefreshTrigger }: AdminLevelsProps) => (
    <button onClick={() => setRefreshTrigger((prev) => prev + 1)}>Refresh</button>
  ),
}));

describe('AdministrationLevelsPage', () => {
  it('affiche le loader au chargement', () => {
    render(<AdministrationLevelsPage />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('charge la configuration des niveaux depuis levels_config', async () => {
    render(<AdministrationLevelsPage />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('levels_config');
    });
  });

  it('recharge les données quand le trigger change', async () => {
    render(<AdministrationLevelsPage />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });

    const initialCalls = (supabase.from as Mock).mock.calls.length;
    const refreshBtn = screen.getByText('Refresh');
    refreshBtn.click();

    await waitFor(() => {
      expect((supabase.from as Mock).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
