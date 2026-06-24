create or replace function public.update_xp_with_reason(
  target_user_id uuid,
  new_xp int,
  log_reason text
)
returns void as $$
declare
  old_xp int;
  actual_reason text;
begin
  -- 1. On récupère l'ancienne XP de l'utilisateur
  select xp into old_xp from public.profiles where id = target_user_id;

  -- Formatage de la raison
  actual_reason := coalesce(log_reason, 'Modification système');

  -- 2. CAS SPÉCIAL : Si l'utilisateur reste bloqué à 0 suite à une perte
  if old_xp = 0 and new_xp = 0 then
    insert into public.xp_logs (user_id, amount, reason)
    values (target_user_id, 0, actual_reason);
    
    -- On quitte la fonction ici, pas besoin d'update la table profiles pour rien
    return;
  end if;

  -- 3. CAS NORMAL : L'XP change, on passe par le comportement classique (trigger)
  perform set_config('app.xp_reason', actual_reason, true);
  
  update public.profiles
  set xp = new_xp
  where id = target_user_id;
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