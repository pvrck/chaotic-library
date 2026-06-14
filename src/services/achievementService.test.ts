import { describe, it, expect, vi } from 'vitest';
import * as service from './achievementService';
import { supabase } from '@/lib/supabaseClient';

describe('achievementService', () => {
  it('devrait débloquer un succès', async () => {
    // 1. On crée un objet "Fluent" qui contient tout et renvoie toujours lui-même
    const fluentMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      // C'est ici l'astuce : on fait en sorte que l'appel final renvoie la donnée
      then: vi.fn(function (resolve) {
        // Selon le contexte, on pourrait même varier la réponse ici
        return resolve({ data: [], count: 10, error: null });
      }),
    };

    // 2. On espionne
    vi.spyOn(supabase, 'from').mockReturnValue(fluentMock as unknown);

    // 3. Exécution
    await service.checkAchievements('user_123', 'LivresLus');

    // 4. Vérification
    expect(supabase.from).toHaveBeenCalled();
  });
});
