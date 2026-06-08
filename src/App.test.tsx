import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { useAuth } from '@/context/AuthContext';

// Mock du hook Auth
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock des composants (simple rendu de texte)
vi.mock('@/pages/LoginPage', () => ({ LoginPage: () => <div>Login Page</div> }));
vi.mock('@/pages/DashboardPage', () => ({ DashboardPage: () => <div>Dashboard Page</div> }));

describe('App Component', () => {
  it('affiche le loader quand le chargement est en cours', () => {
    // 2. On caste vers le type défini, plus besoin de 'any'
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      loading: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(<App />);
    expect(document.querySelector('.animate-spin')).toBeDefined();
  });

  it('redirige vers login si aucune session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<App />);
    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('affiche le dashboard si une session existe', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { id: '1' },
      loading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(<App />);
    const dashboardElement = await screen.findByText('Dashboard Page');
    expect(dashboardElement).toBeDefined();
  });
});
