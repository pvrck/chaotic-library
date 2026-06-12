import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnnualGoalCard } from './AnnualGoalCard';

describe('AnnualGoalCard', () => {
  const mockOnSave = vi.fn();

  it('affiche les informations de base', () => {
    render(
      <AnnualGoalCard current={25} goal={50} year={2026} onSave={mockOnSave} isEditable={true} />
    );

    expect(screen.getByText(/Objectif 2026/i)).toBeDefined();
    expect(screen.getByText(/25 \/ 50 livres/i)).toBeDefined();
  });

  it("n'affiche pas le bouton d'édition si isEditable est false", () => {
    render(
      <AnnualGoalCard current={25} goal={50} year={2025} onSave={mockOnSave} isEditable={false} />
    );

    // On cherche l'icône Pencil (ou le bouton parent)
    const editButton = screen.queryByRole('button', { name: /pencil/i });
    expect(editButton).toBeNull();
  });

  it("permet de modifier l'objectif", async () => {
    render(
      <AnnualGoalCard current={25} goal={50} year={2026} onSave={mockOnSave} isEditable={true} />
    );

    // 1. Cliquer sur le bouton édition (Pencil)
    const editButton = screen.getByRole('button', { name: '' }); // Le bouton n'a pas de texte interne
    fireEvent.click(editButton);

    // 2. Changer la valeur dans l'input
    const input = screen.getByRole('spinbutton'); // L'input type="number" est un spinbutton
    fireEvent.change(input, { target: { value: '60' } });

    // 3. Valider
    const saveButton = screen.getByLabelText(/Valider l'objectif/i);
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(60);
  });
});
