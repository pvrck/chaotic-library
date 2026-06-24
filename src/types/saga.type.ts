export interface Saga {
  id: string;
  title: string;
  author: string | null;
  total_volumes: number | null;
  created_at: string;
  created_by: string | null;
}

export interface SagaVolume {
  id: string;
  saga_id: string;
  volume_number: number;
  title: string;
  page_count: number | null;
  cover_url: string | null;
}
