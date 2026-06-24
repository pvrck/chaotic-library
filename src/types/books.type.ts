export enum EBookStatus {
  ALire = 'A lire',
  EnCours = 'En cours',
  Lu = 'Lu',
  Abandonne = 'Abandonné',
}

export enum EBookFormat {
  Papier = 'Papier',
  Numerique = 'Numérique',
  Audio = 'Audio',
  Kindle = 'Kindle',
}

export type BookStatus = EBookStatus;
export type BookFormat = EBookFormat;

export interface Book {
  id?: string;
  user_id?: string;
  title: string;
  author: string;
  status: BookStatus;
  format: BookFormat;
  added_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  saga_name?: string | null;
  saga_id?: string | null;
  volume_number?: number | null;
  is_lc: boolean;
  isbn?: string | null;
  thumbnail?: string | null;
  page_count: number | null;
}

export interface BookDetails {
  description: string | null;
  pageCount: number | undefined;
  publishedDate: string | undefined;
  categories: string[] | undefined;
  image: string | undefined;
}
