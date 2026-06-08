import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types/users.type';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: { updateUser: vi.fn() },
  },
}));

const mockAuth = (profile: Partial<UserProfile>) =>
  ({
    profile: profile as UserProfile, // On force le cast ici pour le test
    refreshProfile: vi.fn(),
  }) as unknown as ReturnType<typeof useAuth>;

describe('Page - ProfilePage', () => {
  it('devrait mettre à jour le profil avec succès', async () => {
    vi.mocked(useAuth).mockReturnValue(
      mockAuth({
        id: '1',
        username: 'Léa',
        xp: 500,
        avatar_url: null,
        created_at: '2026-05-15T10:00:00.000Z',
      })
    );

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as ReturnType<typeof supabase.from>);

    render(<ProfilePage />);

    const input = screen.getByLabelText(/Nom dans la guilde/i);
    fireEvent.change(input, { target: { value: 'LéaNouvelle' } });
    fireEvent.click(screen.getByText(/Enregistrer les changements/i));

    await waitFor(() => {
      expect(screen.getByText(/Profil mis à jour avec succès/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher une erreur si les mots de passe ne correspondent pas', async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth({ id: '1' }));
    render(<ProfilePage />);

    fireEvent.change(screen.getByLabelText(/Nouveau mot de passe/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByText(/Modifier le mot de passe/i));

    expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });
});
