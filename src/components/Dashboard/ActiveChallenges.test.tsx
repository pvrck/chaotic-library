import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActiveChallenges } from './ActiveChallenges';
import { EChallengeType, UserChallenge } from '@/types/challenges.type';

// 🔮 1. MOCK DE SUPABASE (Simule les requêtes .update().eq())
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

// 🔑 2. MOCK DU CONTEXTE D'AUTH
const mockRefreshProfile = vi.fn(() => Promise.resolve());
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-123', xp: 500 },
    refreshProfile: mockRefreshProfile,
  }),
}));

// 🚨 3. MOCK DU WINDOW.ALERT (Pour éviter que le test bloque sur les popups)
vi.stubGlobal('alert', vi.fn());

describe('Component - ActiveChallenges', () => {
  const mockSetRefreshTrigger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : L'état de chargement
  it('devrait afficher le loader quand le composant charge', () => {
    render(
      <ActiveChallenges
        loading={true}
        activeChallenges={[]}
        setRefreshTrigger={mockSetRefreshTrigger}
      />
    );

    // On vérifie que la zone affiche bien le titre mais surtout pas le texte vide
    expect(screen.getByText(/Quêtes en cours/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aucun défi actif/i)).not.toBeInTheDocument();
  });

  // 🧪 Test 2 : La liste vide
  it("devrait afficher un message si aucun défi n'est en cours", () => {
    render(
      <ActiveChallenges
        loading={false}
        activeChallenges={[]}
        setRefreshTrigger={mockSetRefreshTrigger}
      />
    );

    expect(
      screen.getByText(/Aucun défi actif. Viens en activer un ci-dessus !/i)
    ).toBeInTheDocument();
  });

  // 🧪 Test 3 : Affichage d'un défi actif et clic sur "Réussi"
  it('devrait lister les défis et appeler Supabase au clic sur Réussi', async () => {
    // Calcul d'une date d'expiration dans 3 jours pour éviter les surprises de fuseau horaire
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    // Casting global ultra propre pour court-circuiter le typage strict en mode test
    const mockActiveChallenges = [
      {
        id: 'uc-active-1',
        expires_at: futureDate.toISOString(),
        challenge_pool: {
          type: EChallengeType.Chaos,
          title: 'Lire 50 pages ce soir',
          description: 'Sans regarder ton téléphone une seule fois.',
          xp_bonus: 150,
          xp_malus: 50,
        },
      },
    ] as unknown as UserChallenge[];

    render(
      <ActiveChallenges
        loading={false}
        activeChallenges={mockActiveChallenges}
        setRefreshTrigger={mockSetRefreshTrigger}
      />
    );

    // Vérifications visuelles du rendu
    expect(screen.getByText('Lire 50 pages ce soir')).toBeInTheDocument();
    expect(screen.getByText(/3 jours restants/i)).toBeInTheDocument();
    expect(screen.getByText('+150 XP')).toBeInTheDocument();

    // Simuler la validation du défi
    const successButton = screen.getByRole('button', { name: /réussi/i });
    fireEvent.click(successButton);

    // Attente des résolutions de promesses
    await waitFor(() => {
      // Supabase a été mis à jour deux fois (user_challenges + profiles)
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      // Le profil de l'utilisateur a été rafraîchi
      expect(mockRefreshProfile).toHaveBeenCalled();
      // La commande de rafraîchissement du dashboard a été lancée
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });
});
