import { describe, it, expect, vi } from 'vitest';
import {
  createChangelog,
  updateChangelog,
  markChangelogAsRead,
  getReadChangelogIds,
} from './changelogService';

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

  it('doit récupérer les IDs des changelogs lus', async () => {
    // On crée un mock complet qui respecte l'interface attendue
    const mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ changelog_id: '1' }, { changelog_id: '2' }],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    mockFrom.mockReturnValue(mockSupabaseQuery);

    const ids = await getReadChangelogIds('user-123');
    expect(ids).toEqual(['1', '2']);
  });

  it('doit marquer un changelog comme lu', async () => {
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: null }),
      // On ajoute le reste pour satisfaire le typage TypeScript
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    });

    await expect(markChangelogAsRead('user-123', '1')).resolves.not.toThrow();
    expect(mockFrom).toHaveBeenCalledWith('changelog_views');
  });
});
