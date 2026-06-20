import { EAchievementConditionType } from '@/types/achievement.type';

export const CONDITIONS = [
  { value: EAchievementConditionType.LivresLus, label: 'Livres lus' },
  { value: EAchievementConditionType.SagaTerminee, label: 'Saga terminée' },
  { value: EAchievementConditionType.SagaAvancee, label: 'Livres de saga avancée' },
  { value: EAchievementConditionType.LivresAnnee, label: 'Livres lus cette année' },
  { value: EAchievementConditionType.ParticipationLc, label: 'Participation LC' },
  { value: EAchievementConditionType.LivresObjectif, label: 'Objectif de lecture' },
];
