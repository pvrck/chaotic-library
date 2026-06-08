import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeBlock } from './ChallengeBlock';
import { EChallengeStatus, EChallengeType, UserChallenge } from '@/types/challenges.type';

// 🔮 1. MOCK DE SUPABASE
const mockPoolItems = [
  { id: 'pool-1', type: EChallengeType.Chaos, duration_days: 7, title: 'Lire en slip' },
];

const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ data: mockPoolItems, error: null })),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'challenge_pool') return { select: mockSelect };
      if (table === 'user_challenges') return { insert: mockInsert };
      return {};
    }),
  },
}));

// 🔑 2. MOCK DU CONTEXTE D'AUTH
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-123' },
  }),
}));

describe('Component - ChallengeBlock', () => {
  // On prépare de fausses fonctions espionnes pour les props obligatoires
  const mockSetRefreshTrigger = vi.fn();
  const emptyActiveChallenges: UserChallenge[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Affichage initial du mode Mensuel (sans défi en cours)
  it('devrait afficher correctement le bloc Mensuel disponible', () => {
    render(
      <ChallengeBlock
        typeChallenge={EChallengeType.Mensuel}
        setRefreshTrigger={mockSetRefreshTrigger}
        activeChallenges={emptyActiveChallenges}
      />
    );

    expect(screen.getByText('Défi Mensuel')).toBeInTheDocument();
    expect(screen.getByText('ACTIVER LE DÉFI MENSUEL')).toBeInTheDocument();
    expect(screen.getByText('ACTIVER LE DÉFI MENSUEL')).not.toBeDisabled();
  });

  // 🧪 Test 2 : Affichage quand un défi Chaos est déjà en cours
  it('devrait désactiver le bouton si un défi du Chaos est déjà actif', () => {
    const activeChallengesWithChaos = [
      {
        id: 'uc-1',
        user_id: 'user-123',
        challenge_id: 'pool-1',
        status: EChallengeStatus.EnCours,
        expires_at: '2026-07-01',
        challenge_pool: { type: EChallengeType.Chaos },
      },
    ] as unknown as UserChallenge[];

    render(
      <ChallengeBlock
        typeChallenge={EChallengeType.Chaos}
        setRefreshTrigger={mockSetRefreshTrigger}
        activeChallenges={activeChallengesWithChaos}
      />
    );

    expect(screen.getByText('Invoquer le Chaos')).toBeInTheDocument();
    expect(screen.getByText('DÉFI CHAOS ACTIF')).toBeInTheDocument();
    expect(screen.getByText('DÉFI CHAOS ACTIF')).toBeDisabled();
  });

  // 🧪 Test 3 : Clic sur le bouton et invocation réussie
  it('devrait appeler Supabase et déclencher le rafraîchissement au clic sur le bouton', async () => {
    render(
      <ChallengeBlock
        typeChallenge={EChallengeType.Chaos}
        setRefreshTrigger={mockSetRefreshTrigger}
        activeChallenges={emptyActiveChallenges}
      />
    );

    const button = screen.getByText('INVOQUER LE CHAOS');

    // 🔥 On simule l'action de clic de l'utilisateur !
    fireEvent.click(button);

    // On attend que les appels asynchrones à la base de données soient passés
    await waitFor(() => {
      // Vérifie si Supabase a bien reçu l'ordre d'insérer un nouveau défi
      expect(mockInsert).toHaveBeenCalled();
      // Vérifie si la fonction de rafraîchissement du parent a bien été déclenchée
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });
});
