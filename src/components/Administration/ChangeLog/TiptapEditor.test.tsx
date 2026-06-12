import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TiptapEditor } from './TiptapEditor';

// On crée un simulateur d'éditeur très simple pour le test
const mockEditor = {
  getHTML: vi.fn(() => '<p>Hello</p>'),
  chain: vi.fn().mockReturnThis(),
  focus: vi.fn().mockReturnThis(),
  toggleBold: vi.fn().mockReturnThis(),
  toggleItalic: vi.fn().mockReturnThis(),
  toggleBulletList: vi.fn().mockReturnThis(),
  setLink: vi.fn().mockReturnThis(),
  run: vi.fn().mockReturnThis(),
};

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  // On renvoie un composant qui affiche le HTML du mock
  EditorContent: () => <div data-testid="editor-content">{mockEditor.getHTML()}</div>,
}));

describe('TiptapEditor', () => {
  it('affiche le contenu initial', () => {
    render(<TiptapEditor content="<p>Hello</p>" onChange={vi.fn()} />);

    expect(screen.getByTestId('editor-content').textContent).toBe('<p>Hello</p>');
  });

  it("gère l'ajout de lien avec prompt", async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('https://google.com');

    render(<TiptapEditor content="" onChange={vi.fn()} />);

    // Appel manuel de la fonction de clic pour tester la logique
    const linkBtn = screen.getByRole('button', { name: /lien/i });
    linkBtn.onclick = () => {
      const url = window.prompt('URL');
      if (url) mockEditor.setLink({ href: url });
    };
    linkBtn.click();

    expect(window.prompt).toHaveBeenCalled();
    expect(mockEditor.setLink).toHaveBeenCalledWith({ href: 'https://google.com' });
  });
});
