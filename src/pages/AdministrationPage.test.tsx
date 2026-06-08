import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdministrationPage } from './AdministrationPage';
import { useAuth } from '@/context/AuthContext';

// 🔮 1. MOCK DU CONTEXTE D'AUTH
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// 🔮 2. MOCK COMPLET DU CLIENT SUPABASE (API CHAÎNÉE MULTI-TABLES)
const mockOrder = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// 🔮 3. MOCK DES SOUS-COMPOSANTS POUR ALLER VITE (On teste juste la page conteneur)
vi.mock('@/components/Administration/AdminChallenge', () => ({
  AdminChallenge: () => <div data-testid="mock-admin-challenge">Composant Défis Actif</div>,
}));
vi.mock('@/components/Administration/AdminUsers', () => ({
  AdminUsers: () => <div data-testid="mock-admin-users">Composant Joueurs Actif</div>,
}));
vi.mock('@/components/Administration/AdminLevels', () => ({
  AdminLevels: () => <div data-testid="mock-admin-levels">Composant Rangs Actif</div>,
}));

describe('Page - AdministrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Barrière de sécurité (Rôle non-admin ou déconnecté)
  it('devrait bloquer l’accès si l’utilisateur n’est pas admin', () => {
    // On simule un utilisateur classique 'user'
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: '1',
        role: 'user',
        username: 'Léo',
        email: 'leo@test.com',
        xp: 0,
        updated_at: '',
        avatar_url: null,
      },
      session: undefined,
      loading: false,
      refreshProfile: vi.fn(),
    });

    render(<AdministrationPage />);

    expect(screen.getByText(/Accès Interdit/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bureau des Grands Maîtres/i)).not.toBeInTheDocument();
  });

  // 🧪 Test 2 : Accès autorisé et chargement des données
  it('devrait charger et afficher les tableaux de bord si l’utilisateur est admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: '1',
        role: 'admin',
        username: 'Grand Maître',
        email: 'admin@test.com',
        xp: 9999,
        updated_at: '',
        avatar_url: null,
      },
      session: undefined,
      loading: false,
      refreshProfile: vi.fn(),
    });

    // Configuration :
    // Quand on appelle .from().select(), on retourne un objet avec .order
    // ET on simule aussi le fait que select() puisse être utilisé seul.
    mockSelect.mockReturnValue({
      order: mockOrder,
    });

    // On permet à select() d'être appelé comme une promesse (pour profiles)
    // On utilise un cast local uniquement pour dire à TS que c'est une promesse
    mockSelect.mockResolvedValue({ data: [{ id: '1', username: 'Joueur 1' }], error: null });

    // Configuration du retour de order
    mockOrder.mockResolvedValue({
      data: [{ id: 1, title: 'Données Ordonnées Factices' }],
      error: null,
    });

    render(<AdministrationPage />);

    await waitFor(() => {
      expect(screen.getByText(/Bureau des Grands Maîtres/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-admin-challenge')).toBeInTheDocument();
    });
  });

  // 🧪 Test 3 : Changement d'onglet
  it('devrait basculer d’un sous-tableau de bord à un autre lors du clic sur les onglets', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: '1',
        role: 'admin',
        username: 'Grand Maître',
        email: 'admin@test.com',
        xp: 9999,
        updated_at: '',
        avatar_url: null,
      },
      session: undefined,
      loading: false,
      refreshProfile: vi.fn(),
    });

    render(<AdministrationPage />);

    // On attend le rendu final après le useEffect
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Joueurs/i })).toBeInTheDocument();
    });

    // Clic sur l'onglet "Joueurs"
    const usersTabBtn = screen.getByRole('button', { name: /Joueurs/i });
    fireEvent.click(usersTabBtn);

    // Le composant AdminUsers doit maintenant s'afficher
    expect(screen.getByTestId('mock-admin-users')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-admin-challenge')).not.toBeInTheDocument();

    // Clic sur l'onglet "Rangs"
    const levelsTabBtn = screen.getByRole('button', { name: /Rangs/i });
    fireEvent.click(levelsTabBtn);

    expect(screen.getByTestId('mock-admin-levels')).toBeInTheDocument();
  });
});
