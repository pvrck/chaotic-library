create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, role, xp)
  values (
    new.id,
    new.email, -- 🌟 On ajoute l'email qui est obligatoire !
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), -- Fallback si pas de pseudo transmis
    'user',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

-- Déclencheur à chaque inscription
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();