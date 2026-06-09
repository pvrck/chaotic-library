import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

// On mocke les routes pour éviter les dépendances externes complexes
vi.mock('@/constants/routes', () => ({
  ADMIN_CHANGELOG: '/admin/changelog',
  ADMIN_CHALLENGE: '/admin/challenges',
  ADMIN_LEVELS: '/admin/levels',
  ADMIN_UTILISATEURS: '/admin/users',
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
    expect(screen.getByText('← Retour au site')).toBeDefined();
  });

  it('affiche un lien vers le site public', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    const backLink = screen.getByRole('link', { name: /retour au site/i });
    expect(backLink.getAttribute('href')).toBe('/');
  });
});
