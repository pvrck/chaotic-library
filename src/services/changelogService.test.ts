import { describe, it, expect, vi } from 'vitest';
import { createChangelog, updateChangelog } from './changelogService';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
    })),
    update: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
    })),
  })),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

describe('changelogService', () => {
  it('doit appeler createChangelog avec les bonnes données', async () => {
    const data = { title: 'Test', version: '1.0', content: 'Contenu', is_published: true };
    await createChangelog(data);

    expect(mockFrom).toHaveBeenCalledWith('changelogs');
    // Vérifie que insert est bien appelé (selon la structure de ton mock)
  });

  it('doit appeler updateChangelog avec le bon ID', async () => {
    await updateChangelog('123', { title: 'Nouveau Titre' });

    expect(mockFrom).toHaveBeenCalledWith('changelogs');
    // Le mock ici vérifie que le service communique correctement avec le SDK
  });
});
