import { EBookFormat } from './books.type';

export enum EChallengeType {
  Mensuel = 'mensuel',
  Chaos = 'chaos',
}

export enum EChallengeStatus {
  EnCours = 'en_cours',
  Reussi = 'reussi',
  Echoue = 'echoue',
  Expire = 'expire',
}

export enum EConditionType {
  BooksRead = 'BOOKS_READ',
  PagesRead = 'PAGES_READ',
  SagaContinue = 'SAGA_CONTINUE',
  SagaEnd = 'SAGA_END',
  SagaStart = 'SAGA_START',
  AuthorRepeat = 'AUTHOR_REPEAT',
  FormatMix = 'FORMAT_MIX',
  PalAge = 'PAL_AGE',
  NoAbandon = 'NO_ABANDON',
  LCParticipation = 'LC_PARTICIPATION',
}

export enum EOperator {
  Gte = 'GTE',
  Eq = 'EQ',
  Lte = 'LTE',
}

export type ConditionType = EConditionType;

export interface ChallengeCondition {
  type: ConditionType;
  operator: EOperator;
  threshold: number;
  params?: {
    saga_is_first?: boolean;
    required_formats?: EBookFormat[];
    compare_to_pal?: boolean;
    is_lc?: boolean;
  };
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
  condition: ChallengeCondition | null;
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

export interface UserChallengeBoard extends UserChallenge {
  progress: number;
}
