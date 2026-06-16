import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useXpHistory } from './useXpHistory';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// Mock des dépendances
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [{ id: '1', amount: 100 }], error: null }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useXpHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({ profile: { id: 'user-1' } });
  });

  it('devrait charger les logs au montage', async () => {
    const { result } = renderHook(() => useXpHistory(10));

    // Au début, c'est en chargement
    expect(result.current.loading).toBe(true);

    // Après l'effet, les données doivent être présentes
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toEqual([{ id: '1', amount: 100 }]);
  });

  it('devrait gérer les erreurs de fetch', async () => {
    // On force une erreur sur le mock
    (supabase.from as Mock).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed to fetch') }),
    });

    const { result } = renderHook(() => useXpHistory());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch');
    });
  });
});
