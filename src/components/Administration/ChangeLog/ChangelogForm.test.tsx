import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangelogForm } from './ChangelogForm';

vi.mock('./TiptapEditor', () => ({
  TiptapEditor: ({ onChange }: { onChange: (html: string) => void }) => (
    <div data-testid="tiptap-editor">
      <button data-testid="trigger-btn" onClick={() => onChange('<p>Contenu test</p>')}>
        Trigger Change
      </button>
    </div>
  ),
}));

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

  /* it('appelle createChangelog lors de la soumission en création', async () => {
  const user = userEvent.setup(); // Initialise user-event
  render(<ChangelogForm />);

  // 1. Utilise user.type pour garantir la mise à jour du state
  await user.type(screen.getByLabelText(/Titre/i), 'Nouveau titre');
  await user.type(screen.getByLabelText(/Version/i), '1.0.0');

  // 2. Déclenche l'éditeur
  // On utilise user.click pour être synchro avec user.type
  await user.click(screen.getByTestId('trigger-btn'));

  // 3. Soumission
  const submitBtn = screen.getByRole('button', { name: /Publier la mise à jour/i });
  await user.click(submitBtn);

  // 4. Vérification
  await waitFor(() => {
    expect(createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Nouveau titre',
        version: '1.0.0',
        content: '<p>Contenu test</p>',
        is_published: true,
      })
    );
  });
});*/

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
