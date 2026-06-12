-- 0. Création des ENUM
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE book_status AS ENUM ('A lire', 'En cours', 'Lu', 'Abandonné');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE book_format AS ENUM ('Papier', 'Numérique', 'Audio', 'Kindle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('en_cours', 'reussi', 'echoue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Table des niveaux
CREATE TABLE IF NOT EXISTS public.levels_config (
    id SERIAL PRIMARY KEY,
    xp_min INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Table des profils (utilisation de l'ENUM app_role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  xp integer NOT NULL DEFAULT 0,
  username text,
  avatar_url text DEFAULT '📖'
);

-- 3. Table des livres (utilisation des ENUM book_status et book_format)
CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  status book_status NOT NULL DEFAULT 'A lire',
  format book_format NOT NULL DEFAULT 'Papier',
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  finished_at timestamp with time zone,
  saga_name text,
  saga_volume integer,
  is_lc boolean NOT NULL DEFAULT FALSE
);

-- 4. Table des défis
CREATE TABLE IF NOT EXISTS public.challenge_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('mensuel', 'chaos')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_by uuid REFERENCES auth.users(id),
  duration_days integer DEFAULT 7,
  xp_bonus integer NOT NULL DEFAULT 100,
  xp_malus integer NOT NULL DEFAULT 50
);

-- 5. Table des défis en cours (utilisation de l'ENUM challenge_status)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenge_pool(id) ON DELETE CASCADE,
  status challenge_status NOT NULL DEFAULT 'en_cours',
  activated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- 6. Trigger pour le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, xp, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'Lectrice'), 
    0, 
    'user'::app_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();