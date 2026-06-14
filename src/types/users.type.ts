export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
  xp: number;
  updated_at: string | null;
  avatar_url: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  created_at: string;
}
