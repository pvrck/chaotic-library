import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EChallengeType } from '@/types/challenges.type';
import { ChallengeBoard } from './ChallengeBoard';

// 🔮 1. MOCK DE SUPABASE (.select().eq().eq().then())
const mockData = [
  {
    id: 'uc-100',
    status: 'en_cours',
    challenge_pool: {
      type: EChallengeType.Mensuel,
      title: "Défi de l'été",
      description: 'Lire un pavé de 600 pages',
      xp_bonus: 200,
      xp_malus: 100,
    },
  },
];

// Structure en promesse standard (.then) comme utilisée dans ton useEffect
const mockThen = vi.fn((callback) => callback({ data: mockData }));
const mockEq2 = vi.fn(() => ({ then: mockThen }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// 🔑 2. MOCK DU CONTEXTE D'AUTH
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-789' },
  }),
}));

describe('Component - ChallengeBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test unique et costaud : L'orchestration globale
  it('devrait charger les défis en cours au montage et afficher les composants enfants', async () => {
    render(<ChallengeBoard />);

    // 1. Vérifie que le parent va bien interroger la table 'user_challenges'
    // et filtre sur le statut 'en_cours' pour l'utilisateur connecté
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalledWith('*, challenge_pool:challenge_id (*)');
      expect(mockEq2).toHaveBeenCalledWith('status', 'en_cours');
    });

    // 2. Vérifie que les deux blocs d'activation de défis (les enfants) sont rendus à l'écran
    expect(screen.getByText('Défi Mensuel')).toBeInTheDocument();
    expect(screen.getByText('Invoquer le Chaos')).toBeInTheDocument();

    // 3. Vérifie que la liste des quêtes (ActiveChallenges) affiche le défi récupéré par le parent
    expect(screen.getByText('Quêtes en cours (1)')).toBeInTheDocument();
    expect(screen.getByText("Défi de l'été")).toBeInTheDocument();
  });
});
