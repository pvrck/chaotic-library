import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookPagination } from './BookPagination';
import { Book } from '@/types/books.type';

describe('Component - BookPagination', () => {
  // Mock d'une liste de livres bidon juste pour la longueur du tableau
  const mockBooks = [{}, {}, {}] as Book[];
  const mockSetCurrentPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Affichage des textes de statut
  it('devrait afficher correctement les informations de pagination', () => {
    render(
      <BookPagination
        currentPage={2}
        totalPages={5}
        setCurrentPage={mockSetCurrentPage}
        filteredAndSortedBooks={mockBooks}
      />
    );

    expect(screen.getByText('Page 2 sur 5 (3 livres)')).toBeInTheDocument();
  });

  // 🧪 Test 2 : Première page (Bouton Précédent désactivé)
  it('devrait désactiver le bouton précédent si on est sur la page 1', () => {
    render(
      <BookPagination
        currentPage={1}
        totalPages={3}
        setCurrentPage={mockSetCurrentPage}
        filteredAndSortedBooks={mockBooks}
      />
    );

    const prevButton = screen.getAllByRole('button')[0] as HTMLButtonElement;
    const nextButton = screen.getAllByRole('button')[1] as HTMLButtonElement;

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  // 🧪 Test 3 : Dernière page (Bouton Suivant désactivé)
  it('devrait désactiver le bouton suivant si on est sur la dernière page', () => {
    render(
      <BookPagination
        currentPage={3}
        totalPages={3}
        setCurrentPage={mockSetCurrentPage}
        filteredAndSortedBooks={mockBooks}
      />
    );

    const prevButton = screen.getAllByRole('button')[0] as HTMLButtonElement;
    const nextButton = screen.getAllByRole('button')[1] as HTMLButtonElement;

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  // 🧪 Test 4 : Clic sur le bouton Suivant (Analyse de la fonction de mise à jour)
  it('devrait appeler setCurrentPage avec une fonction qui incrémente la page', () => {
    render(
      <BookPagination
        currentPage={2}
        totalPages={5}
        setCurrentPage={mockSetCurrentPage}
        filteredAndSortedBooks={mockBooks}
      />
    );

    const nextButton = screen.getAllByRole('button')[1];
    fireEvent.click(nextButton);

    expect(mockSetCurrentPage).toHaveBeenCalledTimes(1);

    // 🧠 L'astuce : On récupère la fonction passée à mockSetCurrentPage
    const updaterFunction = mockSetCurrentPage.mock.calls[0][0];

    // On teste le comportement de cette fonction isolée : f(2) devrait donner 3
    expect(updaterFunction(2)).toBe(3);
    // On teste la sécurité mathématique (ne pas dépasser totalPages) : f(5) devrait rester à 5
    expect(updaterFunction(5)).toBe(5);
  });

  // 🧪 Test 5 : Clic sur le bouton Précédent
  it('devrait appeler setCurrentPage avec une fonction qui décrémente la page', () => {
    render(
      <BookPagination
        currentPage={2}
        totalPages={5}
        setCurrentPage={mockSetCurrentPage}
        filteredAndSortedBooks={mockBooks}
      />
    );

    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);

    expect(mockSetCurrentPage).toHaveBeenCalledTimes(1);

    const updaterFunction = mockSetCurrentPage.mock.calls[0][0];

    // Comportement normal : f(2) devrait donner 1
    expect(updaterFunction(2)).toBe(1);
    // Sécurité mathématique : f(1) ne doit pas descendre en dessous de 1
    expect(updaterFunction(1)).toBe(1);
  });
});
