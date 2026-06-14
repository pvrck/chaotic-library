export enum EChallengeType {
  Mensuel = 'mensuel',
  Chaos = 'chaos',
}

export enum EChallengeStatus {
  EnCours = 'en_cours',
  Reussi = 'reussi',
  Echoue = 'echoue',
}

export type ChallengeStatus = EChallengeStatus;

export interface ChallengePoolItem {
  id: string;
  title: string;
  description: string | null;
  type: EChallengeType;
  duration_days?: number | null;
  xp_bonus: number;
  xp_malus: number;
  created_at?: string | null;
  created_by?: string | null;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: EChallengeStatus;
  activated_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  challenge_pool: ChallengePoolItem;
}
