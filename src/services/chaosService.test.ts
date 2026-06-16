import { vi, describe, it, expect, beforeEach } from 'vitest';
import { triggerChaosChallenge, handleXpGain } from './chaosService';
import { supabase } from '@/lib/supabaseClient';
import { Book, EBookStatus } from '@/types/books.type';
import { User, UserResponse } from '@supabase/supabase-js';
import { updateXpWithReason } from '@/utils/xpUtils';

// Mock de Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

vi.mock('@/utils/xpUtils', () => ({
  updateXpWithReason: vi.fn().mockResolvedValue({ error: null }),
}));

describe('ChaosServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerChaosChallenge', () => {
    it('devrait retourner null si aucun utilisateur n’est connecté', async () => {
      // On passe par 'unknown' pour forcer le cast vers le type officiel
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as unknown as UserResponse);

      const result = await triggerChaosChallenge();
      expect(result).toBeNull();
    });

    it('devrait retourner un message de succès quand un défi est trouvé', async () => {
      // 1. Mock de l'utilisateur
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: '1' } as User },
        error: null,
      } as UserResponse);

      // 2. Mock du premier appel (le SELECT/NEQ)
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'd1',
              status: 'disponible',
              challenge_pool: [{ title: 'Défi test', xp_bonus: 50, xp_malus: 0 }],
            },
          ],
          error: null,
        }),
      };

      // 3. Mock du second appel (le UPDATE/EQ)
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      // On injecte les mocks l'un après l'autre
      vi.mocked(supabase.from)
        .mockImplementationOnce(() => mockSelect as unknown as ReturnType<typeof supabase.from>)
        .mockImplementationOnce(() => mockUpdate as unknown as ReturnType<typeof supabase.from>);

      // 4. Execution
      const result = await triggerChaosChallenge();

      // 5. Assertion
      expect(result).not.toBeNull();
      expect(result).toContain('🔮 LE CHAOS A PARLÉ');
    });
  });

  describe('handleXpGain', () => {
    it('devrait calculer correctement l’XP pour un livre lu', async () => {
      // Mock de l'utilisateur
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user_1' } as User },
        error: null,
      } as UserResponse);

      type SupabaseFrom = typeof supabase.from;

      // Mock de Supabase pour le SELECT de l'XP actuel
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { xp: 100 }, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<SupabaseFrom>);

      await handleXpGain(EBookStatus.Lu, { title: 'Dune' } as Book);

      // On vérifie que c'est l'utilitaire qui est appelé avec le calcul (100 + 120 = 220)
      expect(updateXpWithReason).toHaveBeenCalledWith(
        'user_1',
        220,
        expect.stringContaining('Livre terminé')
      );
    });
  });
});
