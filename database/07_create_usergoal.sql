create table user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  year int not null,
  target_count int not null,
  created_at timestamptz default now(),
  
  -- Empêche d'avoir deux lignes pour la même année
  unique(user_id, year)
);

-- Active la sécurité (RLS)
alter table user_goals enable row level security;

-- Politique : chaque utilisateur ne voit que ses propres objectifs
create policy "Users can view their own goals" on user_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert/update their own goals" on user_goals
  for all using (auth.uid() = user_id);