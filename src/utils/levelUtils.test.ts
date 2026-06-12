import { describe, it, expect } from 'vitest';
import { getPlayerLevelInfo } from './levelUtils';
import { Level } from '@/types/levels.type';

describe('levelUtils - getPlayerLevelInfo()', () => {
  // 📜 On prépare un faux jeu de données (Mock) pour nos tests
  const mockLevels: Level[] = [
    { id: 1, xp_min: 0, title: 'Novice' },
    { id: 2, xp_min: 1000, title: 'Apprentie' },
    { id: 3, xp_min: 3000, title: 'Exploratrice' },
  ];

  // 🧪 Test 1 : Le cas de départ (0 XP)
  it("devrait retourner le premier niveau quand l'XP est à 0", () => {
    const result = getPlayerLevelInfo(0, mockLevels);

    expect(result.title).toBe('Novice');
    expect(result.nextLevelXp).toBe(1000);
    expect(result.progressPercentage).toBe(0); // 0% de progression
  });

  // 🧪 Test 2 : Progression à mi-chemin
  it('devrait calculer le bon pourcentage à mi-chemin du niveau suivant', () => {
    const result = getPlayerLevelInfo(500, mockLevels); // Pile entre 0 et 1000

    expect(result.title).toBe('Novice');
    expect(result.progressPercentage).toBe(50); // 50%
  });

  // 🧪 Test 3 : Changement de palier de niveau
  it('devrait correctement basculer au niveau supérieur quand le palier est atteint', () => {
    const result = getPlayerLevelInfo(1500, mockLevels); // Entre 1000 et 3000

    expect(result.title).toBe('Apprentie');
    expect(result.nextLevelXp).toBe(3000);
    // (1500 - 1000) / (3000 - 1000) = 500 / 2000 = 25%
    expect(result.progressPercentage).toBe(25);
  });

  // 🧪 Test 4 : Le niveau maximum (Cas limite)
  it('devrait bloquer la progression à 100% et mettre nextLevelXp à null si le niveau max est atteint', () => {
    const result = getPlayerLevelInfo(4000, mockLevels); // Au-dessus du dernier niveau (3000)

    expect(result.title).toBe('Exploratrice');
    expect(result.nextLevelXp).toBeNull();
    expect(result.progressPercentage).toBe(100);
  });
});
