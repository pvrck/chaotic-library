-- Fonction qui insère le log
create or replace function public.log_xp_change()
returns trigger as $$
declare
  diff int;
  change_reason text;
begin
  diff := new.xp - old.xp;
  if diff = 0 then return new; end if;

  -- Récupère la raison via la session
  change_reason := current_setting('app.xp_reason', true);
  
  -- Si aucune raison n'est passée, on utilise un terme plus explicite
  if change_reason = '' or change_reason is null then
    change_reason := 'Modification système';
  end if;

  insert into public.xp_logs (user_id, amount, reason)
  values (new.id, diff, change_reason);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger attaché à la table profiles
create trigger on_xp_updated
after update of xp on public.profiles
for each row execute function public.log_xp_change();

create or replace function public.update_xp_with_reason(
  target_user_id uuid,
  new_xp int,
  log_reason text
)
returns void as $$
begin
  -- On force la raison dans la session locale pour le trigger
  perform set_config('app.xp_reason', log_reason, true);
  
  -- On effectue la mise à jour
  update public.profiles
  set xp = new_xp
  where id = target_user_id;
end;
$$ language plpgsql security definer;