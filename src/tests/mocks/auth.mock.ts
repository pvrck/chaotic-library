import { vi } from 'vitest';
import { useAuth } from '@/context/AuthContext';

type UseAuthReturn = ReturnType<typeof useAuth>;

export const createAuthMock = (overrides: Partial<UseAuthReturn> = {}): UseAuthReturn => {
  return {
    session: undefined,
    loading: false,
    refreshProfile: vi.fn(),
    profile: null,
    ...overrides,
  } as UseAuthReturn;
};
