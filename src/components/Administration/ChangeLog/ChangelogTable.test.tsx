import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChangelogTable } from './ChangelogTable';
import { supabase } from '@/lib/supabaseClient';

// 1. On mocke supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

describe('ChangelogTable', () => {
  const mockLogs = [
    {
      id: '1',
      title: 'Test Log',
      version: '1.0',
      content: '...',
      created_at: '',
      is_published: true,
    },
  ];

  it('appelle onEdit quand on clique sur le bouton modifier', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<ChangelogTable logs={mockLogs} onAction={vi.fn()} onEdit={onEdit} />);

    // On utilise aria-label (qu'on a ajouté précédemment)
    const editBtn = screen.getByRole('button', { name: /modifier/i });
    await user.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith(mockLogs[0]);
  });

  it('supprime le log et appelle onAction après confirmation', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    // Mock du confirm navigateur
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<ChangelogTable logs={mockLogs} onAction={onAction} onEdit={vi.fn()} />);

    const deleteBtn = screen.getByRole('button', { name: /supprimer/i });
    await user.click(deleteBtn);

    // Vérifie que le service Supabase a bien été appelé
    expect(supabase.from).toHaveBeenCalledWith('changelogs');
    // Vérifie que la liste est rafraîchie après suppression
    expect(onAction).toHaveBeenCalled();
  });
});
