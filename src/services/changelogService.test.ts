import { describe, it, expect, vi } from 'vitest';
import { supabase } from '@/lib/supabaseClient';
import { createChangelog, getReadChangelogIds } from './changelogService';

// Création d'un mock qui retourne toujours un objet contenant toutes les méthodes possibles
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}));

describe('changelogService', () => {
  it('doit appeler createChangelog avec les bonnes données', async () => {
    // On configure le maillon final de la chaîne pour ce test
    vi.mocked(mockSupabaseQuery.insert).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
    });

    await createChangelog({ title: 'Test', version: '1.0', content: 'C', is_published: true });

    expect(supabase.from).toHaveBeenCalledWith('changelogs');
  });

  it('doit récupérer les IDs des changelogs lus', async () => {
    vi.mocked(mockSupabaseQuery.eq).mockResolvedValue({
      data: [{ changelog_id: '1' }, { changelog_id: '2' }],
      error: null,
    });

    const ids = await getReadChangelogIds('user-123');
    expect(ids).toEqual(['1', '2']);
  });
});
