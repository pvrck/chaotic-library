// src/setupTests.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn(function (resolve) {
        return resolve({ data: [], error: null });
      }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));
