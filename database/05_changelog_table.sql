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
