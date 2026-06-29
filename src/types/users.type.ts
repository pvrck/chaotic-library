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
  is_private: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  created_at: string;
}

export interface CommunityUser {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  registration_date: string;
  last_activity: string | null;
  is_private: boolean;
}

export interface PreviewUser {
  id: string;
  username: string;
  avatar_url: string;
  xp: number;
}
