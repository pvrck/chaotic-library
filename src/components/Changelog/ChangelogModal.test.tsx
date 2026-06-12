import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChangelogModal } from './ChangelogModal';
import '@testing-library/jest-dom';

describe('ChangelogModal', () => {
  const mockChangelog = {
    id: '1',
    version: '1.0.0',
    created_at: '2026-06-09',
    title: 'Le renouveau',
    content: 'Contenu',
    is_published: true,
  };

  it('affiche le contenu du changelog passé en props', () => {
    render(<ChangelogModal changelog={mockChangelog} onClose={() => {}} />);

    expect(screen.getByText('✨ Quoi de neuf ?')).toBeInTheDocument();
    expect(screen.getByText('Le renouveau')).toBeInTheDocument();
  });

  it('appelle la fonction onClose quand on clique sur le bouton', () => {
    const handleClose = vi.fn(); // Création d'une fonction espionne (spy)
    render(<ChangelogModal changelog={mockChangelog} onClose={handleClose} />);

    const closeButton = screen.getByText('Ok, compris !');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
