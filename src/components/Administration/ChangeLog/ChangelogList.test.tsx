import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, Mock } from 'vitest';
import { ChangelogList } from './ChangelogList';
import * as changelogService from '@/services/changelogService';

// 1. Mocke le module entier
vi.mock('@/services/changelogService', () => ({
  getChangelogs: vi.fn(),
}));

describe('ChangelogList', () => {
  it('affiche les changelogs chargés avec leurs détails', async () => {
    const mockLogs = [
      {
        id: '1', // Attention : id en string ou nombre selon ton type
        title: 'Ma Super Version',
        content: 'Ceci est le contenu',
        version: '1.0.0',
        created_at: new Date().toISOString(),
        is_published: true,
      },
    ];

    (changelogService.getChangelogs as Mock).mockResolvedValue(mockLogs);

    render(<ChangelogList />);

    // Vérifie le titre
    expect(await screen.findByText('Ma Super Version')).toBeDefined();
    // Vérifie le contenu
    expect(screen.getByText('Ceci est le contenu')).toBeDefined();
    // Vérifie la version
    expect(screen.getByText('1.0.0')).toBeDefined();
  });
});
