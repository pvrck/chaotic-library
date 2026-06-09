import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangelogForm } from './ChangelogForm';
import { createChangelog } from '@/services/changelogService';

// 1. Mock du service
vi.mock('@/services/changelogService', () => ({
  createChangelog: vi.fn(),
  updateChangelog: vi.fn(),
}));

describe('ChangelogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le formulaire en mode création', () => {
    render(<ChangelogForm />);
    expect(screen.getByText(/Ajouter une mise à jour/i)).toBeDefined();
    expect(screen.getByText(/Publier la mise à jour/i)).toBeDefined();
  });

  it('appelle createChangelog lors de la soumission en création', async () => {
    render(<ChangelogForm />);

    fireEvent.change(screen.getByLabelText(/Titre/i), { target: { value: 'Nouveau titre' } });
    fireEvent.change(screen.getByLabelText(/Version/i), { target: { value: '1.0.0' } });
    fireEvent.change(screen.getByLabelText(/Contenu/i), { target: { value: 'Contenu test' } });

    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => {
      expect(createChangelog).toHaveBeenCalledWith({
        title: 'Nouveau titre',
        version: '1.0.0',
        content: 'Contenu test',
        is_published: true,
      });
    });
  });

  it('remplit les champs avec initialData en mode édition', () => {
    const mockData = {
      id: '1',
      title: 'Test',
      version: '2.0',
      content: 'Contenu',
      created_at: '',
      is_published: true,
    };
    render(<ChangelogForm initialData={mockData} />);

    const titleInput = screen.getByLabelText(/Titre/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Test');
    expect(screen.getByText(/Modifier la mise à jour/i)).toBeDefined();
  });
});
