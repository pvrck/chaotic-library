import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminUsers } from './AdminUsers';
import { supabase } from '@/lib/supabaseClient';
import { EUserRole, Profile } from '@/types/users.type';
import { Level } from '@/types/levels.type';

interface MockSupabaseQuery {
  update: (data: Record<string, unknown>) => MockSupabaseQuery;
  eq: (column: string, value: string | number) => Promise<{ error: Error | null }>;
}

// Mock simple de supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/utils/levelUtils', () => ({
  getPlayerLevelInfo: () => ({ title: 'Novice', nextLevelXp: 100, progressPercentage: 50 }),
}));

const mockUsers: Profile[] = [
  {
    id: '1',
    username: 'Alice',
    email: 'alice@test.com',
    role: EUserRole.user,
    xp: 100,
    avatar_url: '📖',
    updated_at: '2026-01-01',
    is_private: false,
  },
  {
    id: '2',
    username: 'Bob',
    email: 'bob@test.com',
    role: EUserRole.admin,
    xp: 200,
    avatar_url: '📖',
    updated_at: '2026-01-01',
    is_private: false,
  },
];

describe('Component - AdminUsers', () => {
  it('devrait appeler supabase lors de la promotion en admin', async () => {
    // On crée le mock avec les fonctions espions
    const mockFrom: MockSupabaseQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    // On caste en 'unknown' puis en 'any' (ou mieux, le type Supabase attendu)
    // Comme le typage complet de Supabase est trop complexe,
    // le cast 'as unknown as any' est parfois inévitable,
    // mais ici on peut être plus précis :
    vi.mocked(supabase.from).mockReturnValue(
      mockFrom as unknown as ReturnType<typeof supabase.from>
    );

    render(<AdminUsers users={mockUsers} levels={[] as Level[]} setRefreshTrigger={vi.fn()} />);

    fireEvent.click(screen.getByText('Promouvoir'));

    await waitFor(() => {
      expect(mockFrom.update).toHaveBeenCalledWith({ role: 'admin' });
    });
  });
});
