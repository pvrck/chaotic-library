import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/types/users.type';

// Mock des hooks et composants enfants
vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/components/Dashboard/ExperienceBar', () => ({
  ExperienceBar: () => <div data-testid="experience-bar" />,
}));
vi.mock('@/components/Dashboard/ChallengeBoard', () => ({
  ChallengeBoard: () => <div data-testid="challenge-board" />,
}));
vi.mock('@/components/Dashboard/Stats/Stats', () => ({
  Stats: () => <div data-testid="stats-section" />,
}));

type UseAuthReturn = ReturnType<typeof useAuth>;

const createAuthMock = (overrides: Partial<UseAuthReturn>): UseAuthReturn =>
  ({
    session: undefined,
    loading: false,
    refreshProfile: vi.fn(),
    profile: null,
    ...overrides,
  }) as UseAuthReturn;

describe('Page - DashboardPage', () => {
  it('devrait afficher le nom de l’utilisateur et les composants enfants', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({ profile: { username: 'Léa' } as Profile }));

    render(<DashboardPage />);

    // Ton test existant
    const title = screen.getByTestId('welcome-title');
    expect(title.textContent).toMatch(/Léa/i);

    // NOUVEAU : Vérifie que les sections sont bien présentes
    expect(screen.getByTestId('experience-bar')).toBeDefined();
    expect(screen.getByTestId('stats-section')).toBeDefined();
    expect(screen.getByTestId('challenge-board')).toBeDefined();
  });

  it('devrait afficher un nom par défaut si aucun profil n’est disponible', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({ profile: undefined }));

    render(<DashboardPage />);

    const title = screen.getByTestId('welcome-title');
    expect(title.textContent).toMatch(/Lectrice Mystère/i);
  });
});
