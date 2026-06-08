import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookSearchBar } from './BookSearchBar';
import { EBookFormat } from '@/types/books.type';
import { SortOption } from '@/types/filters.type';

describe('Component - BookSearchBar', () => {
  const mockSetSearch = vi.fn();
  const mockSetFormatFilter = vi.fn();
  const mockSetSortBy = vi.fn();
  const mockSetCurrentPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Initialisation et valeurs par défaut
  it('devrait afficher l’input et les select avec leurs valeurs initiales', () => {
    render(
      <BookSearchBar
        search="Sanderson"
        setSearch={mockSetSearch}
        formatFilter="Tous"
        setFormatFilter={mockSetFormatFilter}
        sortBy="added_desc"
        setSortBy={mockSetSortBy}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    // Vérifier l'input de recherche
    const input = screen.getByPlaceholderText(
      'Rechercher un titre, auteur, saga...'
    ) as HTMLInputElement;
    expect(input.value).toBe('Sanderson');

    // Vérifier les listes déroulantes (combobox)
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('Tous');
    expect(selects[1].value).toBe('added_desc');
  });

  // 🧪 Test 2 : Saisie dans le champ de recherche
  it('devrait mettre à jour la recherche et réinitialiser la page à 1 lors de la saisie', () => {
    render(
      <BookSearchBar
        search=""
        setSearch={mockSetSearch}
        formatFilter="Tous"
        setFormatFilter={mockSetFormatFilter}
        sortBy="added_desc"
        setSortBy={mockSetSortBy}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    const input = screen.getByPlaceholderText('Rechercher un titre, auteur, saga...');
    fireEvent.change(input, { target: { value: 'Tess Oliver' } });

    expect(mockSetSearch).toHaveBeenCalledWith('Tess Oliver');
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });

  // 🧪 Test 3 : Changement du filtre de format
  it('devrait mettre à jour le filtre de format et réinitialiser la page à 1', () => {
    render(
      <BookSearchBar
        search=""
        setSearch={mockSetSearch}
        formatFilter="Tous"
        setFormatFilter={mockSetFormatFilter}
        sortBy="added_desc"
        setSortBy={mockSetSortBy}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    // On récupère le premier select (Filtre format)
    const formatSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(formatSelect, { target: { value: EBookFormat.Papier } });

    expect(mockSetFormatFilter).toHaveBeenCalledWith(EBookFormat.Papier);
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });

  // 🧪 Test 4 : Changement de l'option de tri
  it('devrait mettre à jour le tri et réinitialiser la page à 1', () => {
    render(
      <BookSearchBar
        search=""
        setSearch={mockSetSearch}
        formatFilter="Tous"
        setFormatFilter={mockSetFormatFilter}
        sortBy="added_desc"
        setSortBy={mockSetSortBy}
        setCurrentPage={mockSetCurrentPage}
      />
    );

    // On récupère le second select (Tri)
    const sortSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(sortSelect, { target: { value: 'title_asc' as SortOption } });

    expect(mockSetSortBy).toHaveBeenCalledWith('title_asc');
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });
});
