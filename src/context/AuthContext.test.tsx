import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { EUserRole, Profile } from '@/types/users.type';

// 🔮 1. PREPARER LES MOCKS SUPABASE FLUIDES
const mockUnsubscribe = vi.fn();

// On supprime l'argument "callback" ici puisqu'on ne l'appelle pas dans ce test
const mockOnAuthStateChange = vi.fn(() => {
  return {
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  };
});

const mockGetSession = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      // En l'écrivant comme ça, on accepte le callback envoyé par le useEffect,
      // mais on n'a pas besoin de lui donner de nom de variable inutile !
      onAuthStateChange: () => mockOnAuthStateChange(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: () => mockSingle(),
        })),
      })),
    })),
  },
}));

// 🧱 2. LE COMPOSANT DUMMY POUR CONSOMMER LE CONTEXTE
const DummyAuthConsumer = () => {
  const { session, profile, loading, refreshProfile } = useAuth();

  if (loading) return <div data-testid="loading">Chargement magique...</div>;

  return (
    <div>
      <div data-testid="session-user">{session?.user?.email || 'Pas de session'}</div>
      <div data-testid="profile-username">{profile?.username || 'Pas de pseudo'}</div>
      <div data-testid="profile-xp">{profile ? `${profile.xp} XP` : '0 XP'}</div>
      <button onClick={refreshProfile}>Rafraîchir le profil</button>
    </div>
  );
};

describe('Context - AuthContext', () => {
  const mockUser = { id: 'usr-123', email: 'lectrice@magique.com' };
  const mockSession = { user: mockUser, access_token: 'token-xyz' };

  // 🟢 Mock de données aligné à 100% sur ton interface Profile
  const mockProfileData: Profile = {
    id: 'usr-123',
    email: 'lectrice@magique.com',
    username: 'Pénélope',
    role: EUserRole.user,
    xp: 1250,
    updated_at: '2026-06-01',
    avatar_url: null,
    is_private: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1
  it('devrait passer loading à false et laisser session indéfinie si aucun utilisateur n’est connecté', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    render(
      <AuthProvider>
        <DummyAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('session-user')).toHaveTextContent('Pas de session');
      // 🟢 Modifié ici
      expect(screen.getByTestId('profile-username')).toHaveTextContent('Pas de pseudo');
    });
  });

  // 🧪 Test 2
  it('devrait charger la session et récupérer le profil de la base de données', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: mockSession } });
    mockSingle.mockResolvedValueOnce({ data: mockProfileData, error: null });

    render(
      <AuthProvider>
        <DummyAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('session-user')).toHaveTextContent('lectrice@magique.com');
      // 🟢 Modifié ici
      expect(screen.getByTestId('profile-username')).toHaveTextContent('Pénélope');
      expect(screen.getByTestId('profile-xp')).toHaveTextContent('1250 XP');
    });
  });

  // 🧪 Test 3
  it('devrait permettre de recharger manuellement les données du profil', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: mockSession } });
    mockSingle.mockResolvedValueOnce({ data: mockProfileData, error: null }).mockResolvedValueOnce({
      data: { ...mockProfileData, username: 'Pénélope Mise À Jour' },
      error: null,
    });

    render(
      <AuthProvider>
        <DummyAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-username')).toHaveTextContent('Pénélope');
    });

    const refreshBtn = screen.getByRole('button', { name: 'Rafraîchir le profil' });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByTestId('profile-username')).toHaveTextContent('Pénélope Mise À Jour');
    });
  });

  // 🧪 Test 4 : Nettoyage de la souscription (Unsubscribe) au démontage
  it('devrait nettoyer la souscription onAuthStateChange lors du démontage du composant', () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    const { unmount } = render(
      <AuthProvider>
        <DummyAuthConsumer />
      </AuthProvider>
    );

    // On démonte le composant
    unmount();

    // On vérifie que la fonction de nettoyage renvoyée par Supabase a été déclenchée
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
