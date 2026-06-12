import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangelogItem } from './ChangelogItem';
import '@testing-library/jest-dom';

describe('ChangelogItem', () => {
  const mockProps = {
    version: '1.0.0',
    date: '2026-06-09',
    title: 'Le renouveau de la bibliothèque',
    content: '<p>Contenu de test avec <ul><li>une puce</li></ul></p>',
  };

  it('affiche correctement le titre et la version', () => {
    render(<ChangelogItem {...mockProps} />);

    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Le renouveau de la bibliothèque')).toBeInTheDocument();
  });

  it('affiche la date formatée correctement', () => {
    render(<ChangelogItem {...mockProps} />);
    // Selon ta locale, la date sera formatée par toLocaleDateString()
    // "09/06/2026" ou "09/06/2026" (fr-FR)
    expect(screen.getByText('09/06/2026')).toBeInTheDocument();
  });

  it('rend le contenu HTML', () => {
    render(<ChangelogItem {...mockProps} />);

    const contentElement = screen.getByText(/Contenu de test/i);
    expect(contentElement).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument(); // Vérifie que la liste <ul> est bien présente
  });
});
