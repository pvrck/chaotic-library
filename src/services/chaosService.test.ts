import { vi, describe, it, expect, beforeEach } from 'vitest';
import { triggerChaosChallenge, handleXpGain } from './chaosService';
import { supabase } from '@/lib/supabaseClient';
import { EBookStatus } from '@/types/books.type';
import { User, UserResponse } from '@supabase/supabase-js';

// Mock de Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
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
    it('devrait mettre à jour l’XP dans le profil', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: '1' } as User },
        error: null,
      } as UserResponse);

      // 1. Création d'un mock qui retourne toujours 'this' (lui-même)
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(), // Retourne le mock pour permettre .eq()
        single: vi.fn().mockResolvedValue({ data: { xp: 100 }, error: null }),
      };

      // 2. On injecte le mock
      vi.mocked(supabase.from).mockReturnValue(
        mockFrom as unknown as ReturnType<typeof supabase.from>
      );

      await handleXpGain(EBookStatus.Lu);

      // 3. Vérification des appels
      // Ici on vérifie que .update a été appelé avec les données,
      // puis .eq a été appelé pour cibler le user
      expect(mockFrom.update).toHaveBeenCalledWith({ xp: 220 });
      expect(mockFrom.eq).toHaveBeenCalledWith('id', '1');
    });
  });
});
