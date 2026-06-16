import { describe, it, expect, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XpHistoryFeed } from './XpHistoryFeed';
import { useXpHistory } from '@/hooks/useXpHistory';

// 1. On type le mock explicitement
vi.mock('@/hooks/useXpHistory', () => ({
  useXpHistory: vi.fn(),
}));

// On crée une version typée pour pouvoir l'appeler facilement dans les tests
const mockedUseXpHistory = useXpHistory as Mock;

describe('Component - XpHistoryFeed', () => {
  it('devrait afficher le message de chargement', () => {
    mockedUseXpHistory.mockReturnValue({ logs: [], loading: true });

    render(<XpHistoryFeed />);
    expect(screen.getByText(/Chargement de ton historique/i)).toBeInTheDocument();
  });

  it('devrait afficher une liste de logs', () => {
    const mockLogs = [
      { id: '1', amount: 150, reason: 'Défi réussi', created_at: '2026-06-16T10:00:00Z' },
    ];

    // Ici, le typage est respecté car on utilise le mock typé
    mockedUseXpHistory.mockReturnValue({ logs: mockLogs, loading: false });

    render(<XpHistoryFeed />);
    expect(screen.getByText('Défi réussi')).toBeInTheDocument();
  });
});
