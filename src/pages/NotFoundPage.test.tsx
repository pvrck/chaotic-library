import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotFoundPage from './NotFoundPage';

// 1. On mock useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

describe('Page - NotFoundPage', () => {
  it('devrait afficher le contenu de la page 404', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Page perdue dans le Warp/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Retourner au Tableau de Bord/i })
    ).toBeInTheDocument();
  });

  it('devrait naviguer vers la racine au clic sur le bouton', () => {
    render(<NotFoundPage />);

    const button = screen.getByRole('button', { name: /Retourner au Tableau de Bord/i });
    fireEvent.click(button);

    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});
