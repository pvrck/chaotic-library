import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLevels } from './AdminLevels';
import { Level } from '@/types/levels.type';

// 🔮 MOCK DU CLIENT SUPABASE (API FLUENTE CHAIÎNÉE)
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
const mockDelete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => {
      return {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      };
    }),
  },
}));

describe('Component - AdminLevels', () => {
  // Mock des paliers de niveau initiaux
  const mockLevels: Level[] = [
    { id: 1, xp_min: 0, title: 'Apprentie Lectrice' },
    { id: 2, xp_min: 1000, title: 'Bibliomancienne' },
  ];

  const mockSetRefreshTrigger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Rendu initial de la table
  it('devrait afficher correctement les paliers existants dans le tableau', () => {
    render(<AdminLevels levels={mockLevels} setRefreshTrigger={mockSetRefreshTrigger} />);

    expect(screen.getByText('0 XP')).toBeInTheDocument();
    expect(screen.getByText('✨ Apprentie Lectrice')).toBeInTheDocument();
    expect(screen.getByText('1000 XP')).toBeInTheDocument();
    expect(screen.getByText('✨ Bibliomancienne')).toBeInTheDocument();
  });

  // 🧪 Test 2 : Création d'un nouveau palier (Create)
  it('devrait permettre de graver un nouveau rang et appeler Supabase', async () => {
    render(<AdminLevels levels={mockLevels} setRefreshTrigger={mockSetRefreshTrigger} />);

    const xpInput = screen.getByLabelText(/XP Minimum requis/i);
    const titleInput = screen.getByLabelText(/Nom du Titre Mystique/i);
    const submitBtn = screen.getByRole('button', { name: /Graver le Rang/i });

    // Remplissage du formulaire
    fireEvent.change(xpInput, { target: { value: '2500' } });
    fireEvent.change(titleInput, { target: { value: 'Archiviste Suprême' } });

    // Soumission
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{ xp_min: 2500, title: 'Archiviste Suprême' }]);
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });

  // 🧪 Test 3 : Passage en édition et enregistrement (Update)
  it('devrait permettre de modifier un rang en ligne', async () => {
    render(<AdminLevels levels={mockLevels} setRefreshTrigger={mockSetRefreshTrigger} />);

    // 1. On clique sur le bouton de modification du premier palier
    const editBtn = screen.getAllByTitle('Modifier')[0];
    fireEvent.click(editBtn);

    // 2. On modifie la valeur du titre dans l'input apparu
    const editTitleInput = screen.getByDisplayValue('Apprentie Lectrice');
    fireEvent.change(editTitleInput, { target: { value: 'Apprentie Magicienne' } });

    // 3. On cible proprement le bouton de validation grâce à son aria-label !
    const confirmBtn = screen.getByRole('button', { name: /Valider la modification/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ xp_min: 0, title: 'Apprentie Magicienne' });
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });

  // 🧪 Test 4 : Suppression d'un palier (Delete)
  it('devrait supprimer le palier après confirmation de l’utilisateur', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<AdminLevels levels={mockLevels} setRefreshTrigger={mockSetRefreshTrigger} />);

    // On clique sur l'icône poubelle "Supprimer" du deuxième palier
    const deleteBtn = screen.getAllByTitle('Supprimer')[1];
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Supprimer le rang "Bibliomancienne" ?');

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
