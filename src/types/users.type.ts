export enum EUserRole {
  admin = 'admin',
  user = 'user',
}

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: EUserRole;
  xp: number;
  updated_at: string | null;
  avatar_url: string | null;
  created_at?: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  created_at: string;
}
