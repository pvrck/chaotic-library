create table public.xp_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount int not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Active la sécurité RLS (très important pour que les utilisateurs ne voient que leur historique)
alter table public.xp_logs enable row level security;

create policy "Users can view their own xp logs" on public.xp_logs
  for select using (auth.uid() = user_id);