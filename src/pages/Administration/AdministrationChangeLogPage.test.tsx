import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdministrationChangeLogPage } from './AdministrationChangeLogPage';
import { Changelog } from '@/types/changelog.type';

// 1. On mocke Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: [{ id: '1', title: 'Test Log', version: '1.0', content: 'Contenu' }],
          error: null,
        }),
      })),
    })),
  },
}));

// 2. On mocke les composants enfants
vi.mock('@/components/Administration/ChangeLog/ChangelogForm', () => ({
  ChangelogForm: vi.fn(({ initialData }) => (
    <div data-testid="changelog-form">{initialData ? 'Mode Édition' : 'Mode Création'}</div>
  )),
}));

vi.mock('@/components/Administration/ChangeLog/ChangelogTable', () => ({
  ChangelogTable: vi.fn(({ onEdit, logs }) => (
    <div>
      {logs.map((log: Changelog) => (
        <button key={log.id} onClick={() => onEdit(log)}>
          Éditer {log.title}
        </button>
      ))}
    </div>
  )),
}));

describe('AdministrationChangeLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le formulaire en mode création par défaut', async () => {
    render(<AdministrationChangeLogPage />);
    expect(screen.getByText('Mode Création')).toBeDefined();
  });

  it('passe en mode édition quand on clique sur éditer', async () => {
    const user = userEvent.setup();
    render(<AdministrationChangeLogPage />);

    // On attend que les logs soient chargés
    const editBtn = await screen.findByText('Éditer Test Log');
    await user.click(editBtn);

    // On vérifie que le formulaire est passé en mode édition
    expect(screen.getByText('Mode Édition')).toBeDefined();
  });
});
