import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookItem } from './BookItem';
import { Book, EBookFormat, EBookStatus } from '@/types/books.type';

describe('Component - BookItem', () => {
  // 📚 Mock d'un livre de base en cours de lecture
  const mockBook: Book = {
    id: 'book-123',
    title: 'La Passeuse de Mots',
    author: 'A.J. Twice',
    format: EBookFormat.Papier,
    status: EBookStatus.EnCours,
    is_lc: true,
    saga_name: 'La Passeuse de Mots',
    saga_volume: 1,
    added_at: '2026-05-15T10:00:00.000Z',
    thumbnail: 'https://images.com/passeuse.jpg',
  };

  const mockOnStatusChange = vi.fn();
  const mockOnOpenDetails = vi.fn();
  const mockOnEditClick = vi.fn();
  const mockOnDeleteBook = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Affichage des informations
  it('devrait afficher correctement les informations du livre', () => {
    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    expect(screen.getByText('La Passeuse de Mots')).toBeInTheDocument();
    expect(screen.getByText('A.J. Twice')).toBeInTheDocument();
    expect(screen.getByText('🧬 Saga : La Passeuse de Mots (Vol. 1)')).toBeInTheDocument();
    expect(screen.getByText('👥 LC')).toBeInTheDocument(); // Badge Lecture Commune

    // Vérification de l'image de couverture
    const image = screen.getByRole('img', { name: 'La Passeuse de Mots' }) as HTMLImageElement;
    expect(image.src).toBe('https://images.com/passeuse.jpg');
  });

  // 🧪 Test 2 : Clic global pour voir les détails
  it('devrait appeler onOpenDetails lors du clic sur le bloc d’informations', () => {
    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    // On clique sur le titre pour ouvrir le détail
    const titleContainer = screen.getByText('La Passeuse de Mots');
    fireEvent.click(titleContainer);

    expect(mockOnOpenDetails).toHaveBeenCalledWith(mockBook);
  });

  // 🧪 Test 3 : Changement de statut (XP !)
  it('devrait proposer les boutons "Terminer" et "Abandonner" pour un livre EnCours', () => {
    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    const finishButton = screen.getByRole('button', { name: /🏆 Terminer/i });
    const dropButton = screen.getByRole('button', { name: /Abandonner/i });

    fireEvent.click(finishButton);
    expect(mockOnStatusChange).toHaveBeenCalledWith('book-123', EBookStatus.Lu);

    fireEvent.click(dropButton);
    expect(mockOnStatusChange).toHaveBeenCalledWith('book-123', EBookStatus.Abandonne);
  });

  // 🧪 Test 4 : Isolation du bouton d'édition (stopPropagation)
  it('devrait appeler onEditClick sans déclencher onOpenDetails', () => {
    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    const editButton = screen.getByTitle('Modifier les détails');
    fireEvent.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledWith(mockBook);
    // Grâce au e.stopPropagation(), le clic sur la ligne n'a pas été déclenché !
    expect(mockOnOpenDetails).not.toHaveBeenCalled();
  });

  // 🧪 Test 5 : Suppression avec confirmation acceptée
  it('devrait appeler onDeleteBook si l’utilisateur confirme la suppression', () => {
    // 🧠 On mock la boîte de dialogue confirm pour qu'elle renvoie true (Clic sur OK)
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    const deleteButton = screen.getByTitle('Supprimer le livre');
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnDeleteBook).toHaveBeenCalledWith('book-123');

    confirmSpy.mockRestore();
  });

  // 🧪 Test 6 : Suppression avec confirmation refusée
  it('ne devrait pas appeler onDeleteBook si l’utilisateur annule la suppression', () => {
    // 🧠 On mock la boîte de dialogue confirm pour qu'elle renvoie false (Clic sur Annuler)
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

    render(
      <BookItem
        book={mockBook}
        onStatusChange={mockOnStatusChange}
        onOpenDetails={mockOnOpenDetails}
        onEditClick={mockOnEditClick}
        onDeleteBook={mockOnDeleteBook}
      />
    );

    const deleteButton = screen.getByTitle('Supprimer le livre');
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnDeleteBook).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
