import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type AuthContextType = ReturnType<typeof useAuth>;

// Mock simple des composants enfants pour éviter les erreurs de rendu
vi.mock('@/components/Profile/AchievementsGrid', () => ({
  AchievementsGrid: () => <div data-testid="achievements-grid" />,
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: { updateUser: vi.fn() },
  },
}));

describe('Page - ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait mettre à jour le profil avec succès', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: '1',
        username: 'Léa',
        xp: 500,
        avatar_url: '📖',
        email: 'test@test.com',
        role: 'user',
        updated_at: null,
      },
      refreshProfile: vi.fn(),
    } as unknown as AuthContextType);

    // Mock chaîné de Supabase
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    // Le double cast magique sans "any" se place ici sur l'implémentation
    vi.mocked(supabase.from).mockImplementation((() => {
      return {
        update: mockUpdate,
        eq: mockEq,
      };
    }) as unknown as typeof supabase.from);

    render(<ProfilePage />);

    // Basculer vers l'onglet Profil
    fireEvent.click(screen.getByRole('button', { name: /Mon Profil/i }));

    const input = screen.getByLabelText(/Nom dans la guilde/i);
    fireEvent.change(input, { target: { value: 'LéaNouvelle' } });

    const saveBtn = screen.getByRole('button', { name: /Enregistrer les changements/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Profil mis à jour avec succès/i)).toBeInTheDocument();
    });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: 'LéaNouvelle' }));
  });

  it('devrait valider la correspondance des mots de passe', async () => {
    vi.mocked(useAuth).mockReturnValue({ profile: { id: '1' } } as unknown as AuthContextType);

    // On ajoute le mock vide ici aussi pour éviter que l'appel dans le useEffect/composant ne crash
    vi.mocked(supabase.from).mockImplementation((() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })) as unknown as typeof supabase.from);

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: /Mon Profil/i }));

    fireEvent.change(screen.getByLabelText(/Nouveau mot de passe/i), {
      target: { value: 'pass1' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), {
      target: { value: 'pass2' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Modifier le mot de passe/i }));

    expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });
});
