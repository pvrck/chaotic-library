export enum EAchievementConditionType {
  LivresAnnee = 'livres_annee',
  LivresLus = 'livres_lus',
  ParticipationLc = 'participation_lc',
  SagaAvancee = 'saga_avancee',
  SagaTerminee = 'saga_terminee',
}

export interface Achievement {
  id: string | null;
  title: string;
  description: string;
  condition_type: EAchievementConditionType;
  threshold: number;
  xp_reward: number;
}

export interface AchievementFormData {
  title: string;
  description: string;
  condition_type: string;
  threshold: number;
  xp_reward: number;
}
