export type BookStatus = 'A lire' | 'En cours' | 'Lu' | 'Abandonné';
export type BookFormat = 'Papier' | 'Numérique' | 'Audio' | 'Kindle';

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
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  type: 'mensuel' | 'chaos';
  is_completed: boolean;
  triggered_at: string;
}
