export type BookStatus = 'A lire' | 'En cours' | 'Lu' | 'Abandonné';
export type BookFormat = 'Papier' | 'Numérique' | 'Audio' | 'Kindle';
export type ChallengeStatus = 'en_cours' | 'reussi' | 'echoue';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  status: BookStatus;
  format: BookFormat;
  added_at: string;
  finished_at?: string | null;
  saga_name?: string | null;
  saga_volume?: number | null;
  is_lc: boolean;
  isbn?: string | null;
  thumbnail?: string | null;
}

export interface ChallengePoolItem {
  id: string;
  title: string;
  description: string | null;
  type: 'mensuel' | 'chaos';
  duration_days: number;
  xp_bonus: number;
  xp_malus: number;
  created_at: string;
  created_by?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
  xp: number;
  updated_at: string;
  avatar_url: string | null;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: ChallengeStatus;
  activated_at: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  challenge_pool?: ChallengePoolItem;
}

export interface LevelConfig {
  id: number;
  xp_min: number;
  title: string;
}
