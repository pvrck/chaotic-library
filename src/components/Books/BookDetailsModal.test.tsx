import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookDetailsModal } from './BookDetailsModal';
import { Book, BookDetails } from '@/types/books.type';

describe('Component - BookDetailsModal', () => {
  // 📚 1. On prépare un livre fictif de base
  const mockBook: Book = {
    id: 'book-456',
    title: 'La Passeuse de Mots',
    author: 'AJ Twice',
    thumbnail: 'https://exemple.com/couverture.jpg',
    saga_name: 'La Passeuse de Mots',
    saga_volume: 1,
    // Rajoute ici les autres propriétés obligatoires de ton type Book si TS râle (ex: user_id, pages etc.)
  } as unknown as Book; // Sécurité cast globale pour le test

  const mockOnClose = vi.fn();

  // 🧪 Test 1 : État de chargement (Invocation des archives...)
  it("devrait afficher l'état de chargement lors de la récupération des détails", () => {
    render(
      <BookDetailsModal book={mockBook} details={undefined} loading={true} onClose={mockOnClose} />
    );

    expect(screen.getByText(/Fiche du livre/i)).toBeInTheDocument();
    expect(screen.getByText(/Invocation des archives de Google Books/i)).toBeInTheDocument();
  });

  // 🧪 Test 2 : Rendu réussi avec un résumé trouvé
  it("devrait afficher les informations du livre et le résumé s'il existe", () => {
    const mockDetails: BookDetails = {
      description: 'Dans un monde où les mots ont un pouvoir...',
    } as BookDetails;

    render(
      <BookDetailsModal
        book={mockBook}
        details={mockDetails}
        loading={false}
        onClose={mockOnClose}
      />
    );

    // On vérifie les infos du livre
    expect(screen.getByText('La Passeuse de Mots')).toBeInTheDocument();
    expect(screen.getByText('par AJ Twice')).toBeInTheDocument();
    expect(screen.getByText(/🧬 Saga : La Passeuse de Mots \(Vol\. 1\)/i)).toBeInTheDocument();

    // On vérifie que l'image est là
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockBook.thumbnail);

    // On vérifie le résumé
    expect(screen.getByText('Dans un monde où les mots ont un pouvoir...')).toBeInTheDocument();
  });

  // 🧪 Test 3 : Aucun résumé trouvé -> Bouton de secours Google Search
  it("devrait afficher le bouton de recherche Google si aucun résumé n'est trouvé", () => {
    render(
      <BookDetailsModal book={mockBook} details={undefined} loading={false} onClose={mockOnClose} />
    );

    expect(screen.getByText(/Aucun résumé trouvé dans Google Books/i)).toBeInTheDocument();

    // On cherche le lien externe de secours
    const searchLink = screen.getByRole('link', { name: /Chercher le résumé sur Google/i });
    expect(searchLink).toBeInTheDocument();
    // On teste si l'URL de recherche est bien construite
    expect(searchLink).toHaveAttribute('href', expect.stringContaining('google.com'));
  });

  // 🧪 Test 4 : Action de fermeture
  it('devrait appeler onClose quand on clique sur le bouton fermer ou sur la croix', () => {
    render(
      <BookDetailsModal book={mockBook} details={undefined} loading={false} onClose={mockOnClose} />
    );

    // Clic sur le gros bouton du bas
    const closeButton = screen.getByRole('button', { name: /Fermer la fiche/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
