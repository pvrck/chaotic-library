import { supabase } from '@/lib/supabaseClient';
import { describe, expect, it, vi } from 'vitest';
import { updateXpWithReason } from './xpUtils';

// On mock supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('updateXpWithReason', () => {
  it('devrait appeler la fonction RPC avec les bons arguments', async () => {
    // 1. Setup : le mock rpc renvoie une réussite
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

    // 2. Action
    const result = await updateXpWithReason('user_123', 150, 'Défi réussi');

    // 3. Assertions
    expect(supabase.rpc).toHaveBeenCalledWith('update_xp_with_reason', {
      target_user_id: 'user_123',
      new_xp: 150,
      log_reason: 'Défi réussi',
    });
    expect(result.error).toBeNull();
  });

  it('devrait retourner l’erreur si le RPC échoue', async () => {
    // 1. Setup : simulation d'une erreur venant de Supabase
    const mockError = { message: 'Database error', code: '500' };
    vi.mocked(supabase.rpc).mockResolvedValue({ error: mockError });

    // 2. Action
    const result = await updateXpWithReason('user_123', 150, 'Fail');

    // 3. Assertion
    expect(result.error).toEqual(mockError);
  });
});
