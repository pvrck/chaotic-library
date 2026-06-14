import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

// On mocke les routes
vi.mock('@/constants/routes', () => ({
  ADMIN_CHANGELOG: '/admin/changelog',
  ADMIN_CHALLENGE: '/admin/challenges',
  ADMIN_LEVELS: '/admin/levels',
  ADMIN_UTILISATEURS: '/admin/users',
  ADMIN_SUCCES: '/admin/succes', // N'oublie pas d'ajouter celui-là !
}));

describe('AdminLayout', () => {
  it('affiche tous les liens de navigation de la sidebar', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Panel Admin')).toBeDefined();
    expect(screen.getByText('Changelog')).toBeDefined();
    expect(screen.getByText('Défis')).toBeDefined();
    expect(screen.getByText('Rangs')).toBeDefined();
    expect(screen.getByText('Utilisateurs')).toBeDefined();
    expect(screen.getByText('Succès')).toBeDefined(); // Ajouté pour correspondre à ton composant
    expect(screen.getByText('← Retour')).toBeDefined(); // Corrigé : le texte réel
  });

  it('affiche un lien vers le site public', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    // Corrigé pour correspondre au texte réel
    const backLink = screen.getByRole('link', { name: /retour/i });
    expect(backLink.getAttribute('href')).toBe('/');
  });
});
