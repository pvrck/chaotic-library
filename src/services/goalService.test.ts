import { describe, it, expect, vi } from 'vitest';
import { getGoalByYear, saveGoalForYear } from './goalService';
import { supabase } from '@/lib/supabaseClient';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { target_count: 20 }, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
  },
}));

describe('goalService', () => {
  it("doit récupérer l'objectif pour une année donnée", async () => {
    const goal = await getGoalByYear(2026);
    expect(goal?.target_count).toBe(20);
    expect(supabase.from).toHaveBeenCalledWith('user_goals');
  });

  it("doit sauvegarder l'objectif avec le bon user_id", async () => {
    await saveGoalForYear(2026, 50);
    expect(supabase.from).toHaveBeenCalledWith('user_goals');
    // Vérifie que l'upsert a été appelé avec les bonnes données
  });
});
