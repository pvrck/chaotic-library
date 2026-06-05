import { LevelConfig } from '@/types';

export function getPlayerLevelInfo(xp: number, levels: LevelConfig[]) {
  // On trie les niveaux par XP croissants
  const sortedLevels = [...levels].sort((a, b) => a.xp_min - b.xp_min);

  let currentTitle = 'Inconnue';
  let nextLevelXp: number | null = null;
  let currentLevelMinXp = 0;

  for (let i = 0; i < sortedLevels.length; i++) {
    if (xp >= sortedLevels[i].xp_min) {
      currentTitle = sortedLevels[i].title;
      currentLevelMinXp = sortedLevels[i].xp_min;
      nextLevelXp = sortedLevels[i + 1] ? sortedLevels[i + 1].xp_min : null;
    } else {
      break;
    }
  }

  // Calcul du pourcentage de progression vers le prochain niveau
  let progressPercentage = 100;
  if (nextLevelXp !== null) {
    const range = nextLevelXp - currentLevelMinXp;
    const gainedInCurrentRange = xp - currentLevelMinXp;
    progressPercentage = Math.min(100, Math.max(0, (gainedInCurrentRange / range) * 100));
  }

  return {
    title: currentTitle,
    nextLevelXp,
    progressPercentage: Math.round(progressPercentage),
  };
}
