import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/context/AuthContext';

// Mock des composants et hooks
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/Auth/Auth', () => ({
  default: () => <div data-testid="auth-component">Composant Auth</div>,
}));

describe('Page - LoginPage', () => {
  it('devrait afficher le composant Auth quand l’utilisateur n’est pas connecté', () => {
    // Session est null
    vi.mocked(useAuth).mockReturnValue({ session: null } as unknown as ReturnType<typeof useAuth>);

    render(<LoginPage />);

    expect(screen.getByTestId('auth-component')).toBeInTheDocument();
  });

  it('devrait afficher "Login" si une session existe déjà', () => {
    // Session existe
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } } } as unknown as ReturnType<
      typeof useAuth
    >);

    render(<LoginPage />);

    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
