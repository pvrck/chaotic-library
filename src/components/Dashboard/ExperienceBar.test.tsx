import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ExperienceBar } from './ExperienceBar';

// 🔮 1. MOCK DE SUPABASE
// On intercepte les appels à Supabase pour renvoyer de fausses configurations de niveaux
const mockLevelsData = [
  { id: '1', xp_min: 0, title: 'Novice' },
  { id: '2', xp_min: 1000, title: 'Apprentie' },
  { id: '3', xp_min: 3000, title: 'Exploratrice' },
];

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockLevelsData, error: null })),
      })),
    })),
  },
}));

// 🔑 2. MOCK DE AUTHCONTEXT
// On prépare une variable modifiable pour changer l'XP d'un test à l'autre
let mockXp = 0;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { xp: mockXp },
  }),
}));

describe('Component - ExperienceBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 🧪 Test 1 : L'utilisateur commence sa route (0 XP)
  it('devrait afficher le statut de départ avec 0 XP', async () => {
    mockXp = 0; // On force l'XP à 0 pour ce test
    render(<ExperienceBar />);

    // Comme il y a un useEffect asynchrone pour charger les niveaux,
    // on attend que le texte "Niveau 1" apparaisse à l'écran
    await waitFor(() => {
      expect(screen.getByText(/Niveau 1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Novice/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 1000 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/0 XP au total/i)).toBeInTheDocument();
  });

  // 🧪 Test 2 : L'utilisateur a progressé (500 XP)
  it('devrait afficher la bonne progression intermédiaire', async () => {
    mockXp = 500; // On change l'XP
    render(<ExperienceBar />);

    await waitFor(() => {
      expect(screen.getByText(/Novice/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/500 \/ 1000 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/500 XP au total/i)).toBeInTheDocument();
  });

  // 🧪 Test 3 : L'utilisateur passe au niveau supérieur (1200 XP)
  it("devrait passer au Niveau 2 quand l'XP dépasse le palier", async () => {
    mockXp = 1200;
    render(<ExperienceBar />);

    await waitFor(() => {
      expect(screen.getByText(/Niveau 2/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Apprentie/i)).toBeInTheDocument();
    // 1200 XP total - 1000 XP min = 200 XP gagnés. Le cap est à 2000 XP (3000 - 1000)
    expect(screen.getByText(/200 \/ 2000 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/1200 XP au total/i)).toBeInTheDocument();
  });
});
