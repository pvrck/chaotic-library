import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from './Auth';

// 🔮 MOCK DE SUPABASE AUTH
const { mockSignInWithPassword, mockSignUp } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  },
}));

describe('Component - Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Rendu par défaut (Connexion)
  it('devrait afficher le formulaire de connexion par défaut', () => {
    render(<Auth />);

    expect(screen.getByRole('heading', { name: 'Chaotic Library' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "Pas encore de compte ? S'inscrire" })
    ).toBeInTheDocument();
  });

  // 🧪 Test 2 : Bascule entre Connexion et Inscription
  it("devrait basculer l'affichage lors du clic sur le bouton d'inscription", () => {
    render(<Auth />);

    const toggleBtn = screen.getByRole('button', { name: "Pas encore de compte ? S'inscrire" });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Déjà un compte ? Connecte-toi' })
    ).toBeInTheDocument();
  });

  // 🧪 Test 3 : Soumission Connexion Réussie (Utilisation de getByLabelText 🌟)
  it('devrait appeler signInWithPassword lors de la soumission du formulaire de connexion', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
    render(<Auth />);

    // On cible via les labels maintenant que l'accessibilité est en place !
    const emailInput = screen.getByLabelText(/Adresse email/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitBtn = screen.getByRole('button', { name: 'Se connecter' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  // 🧪 Test 4 : Soumission Inscription Réussie avec Message
  it('devrait appeler signUp et afficher un message de succès en mode inscription', async () => {
    mockSignUp.mockResolvedValueOnce({ data: {}, error: null });
    render(<Auth />);

    // Passage en mode inscription
    fireEvent.click(screen.getByRole('button', { name: "Pas encore de compte ? S'inscrire" }));

    const emailInput = screen.getByLabelText(/Adresse email/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitBtn = screen.getByRole('button', { name: "S'inscrire" });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepassword' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'securepassword',
      });
    });

    // Vérification de l'affichage du message de confirmation
    expect(
      screen.getByText('Inscription réussie ! Vérifie ta boîte mail pour valider ton compte.')
    ).toBeInTheDocument();
  });

  // 🧪 Test 5 : Gestion des erreurs de l'API
  it("devrait afficher un message d'erreur si l'authentification échoue", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Identifiants invalides'),
    });
    render(<Auth />);

    const emailInput = screen.getByLabelText(/Adresse email/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitBtn = screen.getByRole('button', { name: 'Se connecter' });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
    });
  });
});
