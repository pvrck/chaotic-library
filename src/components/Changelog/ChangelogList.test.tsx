import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangelogList } from './ChangelogList';
import '@testing-library/jest-dom';

describe('ChangelogList', () => {
  const mockChangelogs = [
    {
      id: '1',
      version: '1.0.0',
      created_at: '2026-06-09',
      title: 'Titre 1',
      content: 'Contenu 1',
      is_published: true,
    },
    {
      id: '2',
      version: '0.9.0',
      created_at: '2026-05-01',
      title: 'Titre 2',
      content: 'Contenu 2',
      is_published: true,
    },
  ];

  it("rend le bon nombre d'éléments de changelog", () => {
    render(<ChangelogList changelogs={mockChangelogs} />);

    // On vérifie que les titres sont bien présents
    expect(screen.getByText('Titre 1')).toBeInTheDocument();
    expect(screen.getByText('Titre 2')).toBeInTheDocument();
  });

  it('affiche la structure de la timeline (ligne et points)', () => {
    const { container } = render(<ChangelogList changelogs={mockChangelogs} />);

    // Vérifie la présence de la ligne verticale (aria-hidden)
    const line = container.querySelector('[aria-hidden="true"]');
    expect(line).toBeInTheDocument();

    // Vérifie qu'il y a bien des points pour chaque entrée
    const points = container.querySelectorAll('.rounded-full.border.border-gray-300');
    expect(points.length).toBe(2);
  });
});
