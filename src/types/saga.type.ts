export enum ESagaUserStatus {
  ALire = 'a_lire',
  EnCours = 'en_cours',
  Termine = 'termine',
  Abandonne = 'abandonne',
}

export interface UserSagaInteraction {
  status: ESagaUserStatus | null; // null = Non suivie (Calcul automatique ou hors bibliothèque)
  is_favorite: boolean;
}

export interface SagaReaderInfo {
  user_id: string;
  status: ESagaUserStatus | null;
  display_name?: string;
  avatar_url?: string;
}

export interface Saga {
  id: string;
  title: string;
  author: string | null;
  total_volumes: number | null;
  created_at: string;
  created_by: string | null;
  user_interaction: UserSagaInteraction;
  readers: SagaReaderInfo[];
}

export interface SagaVolume {
  id: string;
  saga_id: string;
  volume_number: number;
  title: string;
  page_count: number | null;
  cover_url: string | null;
}
