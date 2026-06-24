-- =======================================================
-- 1. CRÉATION DE LA TABLE DES SAGAS (Catalogue Global)
-- =======================================================
create table public.sagas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  total_volumes int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references public.profiles(id) on delete set null
);

-- =======================================================
-- 2. CRÉATION DE LA TABLE DES VOLUMES DE SAGA
-- =======================================================
create table public.saga_volumes (
  id uuid default gen_random_uuid() primary key,
  saga_id uuid references public.sagas(id) on delete cascade not null,
  volume_number int not null,
  title text not null,
  page_count int,
  cover_url text,
  isbn text
  
  -- Contrainte d'unicité : Pas deux fois le même tome dans la même saga !
  unique (saga_id, volume_number)
);

create index idx_saga_volumes_isbn on public.saga_volumes(isbn);

-- =======================================================
-- 3. MODIFICATION DE LA TABLE DES LIVRES UTILISATEURS
-- =======================================================
-- On lie le livre perso de l'utilisateur à une saga globale et un numéro de tome
alter table public.books 
  add column saga_id uuid references public.sagas(id) on delete set null,
  add column volume_number int;

-- =======================================================
-- 4. SÉCURITÉ & RLS (Row Level Security)
-- =======================================================
alter table public.sagas enable row level security;
alter table public.saga_volumes enable row level security;

-- Politiques pour la table "sagas" (Tout utilisateur connecté peut voir, créer et modifier)
create policy "Les utilisateurs authentifiés peuvent voir les sagas" 
  on public.sagas for select to authenticated using (true);

create policy "Les utilisateurs authentifiés peuvent créer une saga" 
  on public.sagas for insert to authenticated with check (auth.uid() = created_by);

create policy "Les utilisateurs authentifiés peuvent modifier une saga" 
  on public.sagas for update to authenticated using (true);

-- Politiques pour la table "saga_volumes"
create policy "Les utilisateurs authentifiés peuvent voir les volumes" 
  on public.saga_volumes for select to authenticated using (true);

create policy "Les utilisateurs authentifiés peuvent insérer un volume" 
  on public.saga_volumes for insert to authenticated with check (true);

create policy "Les utilisateurs authentifiés peuvent modifier ou supprimer un volume" 
  on public.saga_volumes for all to authenticated using (true);

  -- Politique pour autoriser la suppression uniquement si le profil de l'utilisateur est admin
CREATE POLICY "Seuls les admins peuvent supprimer une saga" 
ON public.sagas
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);