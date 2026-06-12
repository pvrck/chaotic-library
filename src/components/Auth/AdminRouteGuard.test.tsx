import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, Mock } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRouteGuard } from './AdminRouteGuard';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

describe('AdminRouteGuard', () => {
  it("redirige vers / si l'utilisateur n'est pas admin", async () => {
    // 1. On simule un utilisateur connecté mais avec un rôle 'user'
    (supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: { id: '123' } } });
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'user' } }),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Accueil Public</div>} />
          <Route element={<AdminRouteGuard />}>
            <Route path="/admin" element={<div>Contenu Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // L'utilisateur devrait être redirigé vers l'accueil
    await waitFor(() => {
      expect(screen.getByText('Accueil Public')).toBeDefined();
    });
  });

  it("affiche le contenu si l'utilisateur est admin", async () => {
    // 1. On simule un utilisateur avec le rôle 'admin'
    (supabase.auth.getUser as Mock).mockResolvedValue({ data: { user: { id: '123' } } });
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Accueil Public</div>} />
          <Route element={<AdminRouteGuard />}>
            <Route path="/admin" element={<div>Contenu Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // L'utilisateur devrait voir le contenu admin
    await waitFor(() => {
      expect(screen.getByText('Contenu Admin')).toBeDefined();
    });
  });
});
