import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import * as service from './achievementService';
import { supabase } from '@/lib/supabaseClient';
import { updateXpWithReason } from '@/utils/xpUtils';
import { EAchievementConditionType } from '@/types/achievement.type';

// Typage des mocks pour Supabase
type MockChain = {
  select: Mock;
  eq: Mock;
  not: Mock;
  gte: Mock;
  lte: Mock;
  insert: Mock;
  single: Mock;
  then: Mock;
};

// On crée une factory pour éviter le typage flottant
const createMockChain = (): MockChain => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  single: vi.fn().mockReturnThis(),
  then: vi.fn(),
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/utils/xpUtils', () => ({
  updateXpWithReason: vi.fn().mockResolvedValue({ error: null }),
}));

describe('achievementService - strict typing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait débloquer un succès', async () => {
    const mockFrom = supabase.from as Mock;
    const chain = createMockChain();
    mockFrom.mockReturnValue(chain);

    chain.then.mockImplementation((cb) => {
      const lastCall = mockFrom.mock.calls[mockFrom.mock.calls.length - 1][0];

      if (lastCall === 'user_achievements') return cb({ data: [], error: null });
      if (lastCall === 'achievements_definitions') {
        // On retourne la définition
        return cb({
          data: [{ id: 'ach_1', title: 'Grand Lecteur', threshold: 5, xp_reward: 50 }],
          error: null,
        });
      }

      // SI TON SERVICE S'ARRÊTE AVANT CETTE ÉTAPE,
      // C'EST QUE LE SERVICE A DÉJÀ DÉCIDÉ QU'IL N'Y AVAIT PAS DE SUCCÈS.
      if (lastCall === 'books') {
        return cb({ count: 10, error: null });
      }

      if (lastCall === 'profiles') {
        // C'est ici que single() intervient, il faut que ça renvoie un data
        return cb({ data: { xp: 100 }, error: null });
      }
      return cb({ data: null, error: null });
    });

    await service.checkAchievements('user_123', EAchievementConditionType.LivresLus);

    expect(updateXpWithReason).toHaveBeenCalledWith(
      'user_123',
      150,
      expect.stringContaining('Grand Lecteur')
    );
  });
});
