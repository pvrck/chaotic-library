import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminChallenge } from './AdminChallenge';
import { ChallengePoolItem, EChallengeType } from '@/types/challenges.type';

// 🔮 MOCK DE SUPABASE AVEC REQUÊTES CHAÎNÉES
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

describe('Component - AdminChallenge', () => {
  // Mock d'un pool de défis de départ
  const mockChallenges: ChallengePoolItem[] = [
    {
      id: 'challenge-1',
      title: 'Lire un pavé de fantasy',
      description: 'Un bouquin de plus de 800 pages',
      type: EChallengeType.Chaos,
      xp_bonus: 150,
      xp_malus: 30,
      duration_days: 10,
      created_at: '2026-06-01T00:00:00.000Z',
      condition: null,
    },
    {
      id: 'challenge-2',
      title: 'Moisson Graphique',
      description: 'Lire 3 Mangas ou BDs',
      type: EChallengeType.Mensuel,
      xp_bonus: 200,
      xp_malus: 50,
      duration_days: 30,
      created_at: '2026-06-01T00:00:00.000Z',
      condition: null,
    },
  ];

  const mockSetRefreshTrigger = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 🧪 Test 1 : Rendu initial et Filtrage
  it('devrait afficher la liste des défis et permettre le filtrage par type', () => {
    render(
      <AdminChallenge challenges={mockChallenges} setRefreshTrigger={mockSetRefreshTrigger} />
    );

    // Par défaut, "Tout afficher"
    expect(screen.getByText('Lire un pavé de fantasy')).toBeInTheDocument();
    expect(screen.getByText('Moisson Graphique')).toBeInTheDocument();

    // Clic sur le bouton de filtre "Défis du Chaos"
    const chaosFilterBtn = screen.getByRole('button', { name: /🔮 Défis du Chaos/i });
    fireEvent.click(chaosFilterBtn);

    // Le défi mensuel doit disparaître
    expect(screen.getByText('Lire un pavé de fantasy')).toBeInTheDocument();
    expect(screen.queryByText('Moisson Graphique')).not.toBeInTheDocument();
  });

  // 🧪 Test 2 : Soumission et Ajout (Create)
  it('devrait permettre de forger un nouveau défi et l’insérer sur Supabase', async () => {
    render(
      <AdminChallenge challenges={mockChallenges} setRefreshTrigger={mockSetRefreshTrigger} />
    );

    // Remplissage du formulaire à l'aide des balises labels ou placeholders
    const titleInput = screen.getByLabelText(/Intitulé du défi/i);
    const descInput = screen.getByLabelText(/Description \/ Contrainte/i);

    fireEvent.change(titleInput, { target: { value: 'Nuit Blanche' } });
    fireEvent.change(descInput, { target: { value: 'Lire jusqu’à 4h du matin' } });

    // Soumission du formulaire
    const submitBtn = screen.getByRole('button', { name: /Ajouter au Pool de l'Univers/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Vérifie que Supabase a reçu le bon payload d'insertion
      expect(mockInsert).toHaveBeenCalledWith([
        {
          title: 'Nuit Blanche',
          description: 'Lire jusqu’à 4h du matin',
          type: EChallengeType.Chaos,
          xp_bonus: 100,
          xp_malus: 20,
          duration_days: 7,
        },
      ]);
      // Le trigger de rafraîchissement doit s'incrémenter
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });

  // 🧪 Test 3 : Édition en ligne (Update)
  it('devrait basculer en mode édition au clic sur modifier et appeler l’update', async () => {
    render(
      <AdminChallenge challenges={mockChallenges} setRefreshTrigger={mockSetRefreshTrigger} />
    );

    // On clique sur l'icône de modification du premier défi
    const editBtn = screen.getAllByTitle('Modifier le défi')[0];
    fireEvent.click(editBtn);

    // Des inputs de modification doivent être apparus à la place du texte simple
    const editTitleInput = screen.getByDisplayValue('Lire un pavé de fantasy');
    fireEvent.change(editTitleInput, { target: { value: 'Lire un ENORME pavé' } });

    // Clic sur le bouton de validation de modification (icône coche verte)
    const confirmBtn = screen.getByTitle('Valider');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });
  });

  // 🧪 Test 4 : Suppression (Delete)
  it('devrait appeler la suppression si confirm() renvoie true', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <AdminChallenge challenges={mockChallenges} setRefreshTrigger={mockSetRefreshTrigger} />
    );

    const deleteBtn = screen.getAllByTitle('Supprimer définitivement')[0];
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
      expect(mockSetRefreshTrigger).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
