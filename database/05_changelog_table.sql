create table public.changelogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  version text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_published boolean default true
);

-- Active la sécurité (RLS) pour que tout le monde puisse lire, mais seuls les admins puissent écrire
alter table public.changelogs enable row level security;

create policy "Changelogs are viewable by everyone" on public.changelogs for select using (true);

CREATE POLICY "Admins can insert changelogs" ON changelogs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete changelogs" ON public.changelogs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update changelogs" ON public.changelogs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE TABLE IF NOT EXISTS public.changelog_views (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changelog_id UUID NOT NULL REFERENCES public.changelogs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Empêche qu'un utilisateur n'insère deux fois la même lecture
  PRIMARY KEY (user_id, changelog_id)
);

-- Activation de RLS (Row Level Security) pour la sécurité
ALTER TABLE public.changelog_views ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur ne peut voir que ses propres lectures
CREATE POLICY "Utilisateurs peuvent voir leurs propres lectures" 
ON public.changelog_views FOR SELECT 
USING (auth.uid() = user_id);

-- Politique : chaque utilisateur peut insérer sa propre lecture
CREATE POLICY "Utilisateurs peuvent marquer comme lu" 
ON public.changelog_views FOR INSERT 
WITH CHECK (auth.uid() = user_id);