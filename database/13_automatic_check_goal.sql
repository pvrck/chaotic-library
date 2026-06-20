CREATE OR REPLACE FUNCTION check_yearly_goals_cron()
RETURNS void AS $$
DECLARE
    current_year_v int4 := extract(year from now())::int4;
    target_year_v int4 := current_year_v - 1; -- On cible l'année qui vient de se terminer
    achievement_id_v uuid;
    xp_reward_v int4;
    rec RECORD;
BEGIN
    -- 1. Récupérer l'ID et l'XP du succès "livres_objectif"
    SELECT id, xp_reward INTO achievement_id_v, xp_reward_v
    FROM public.achievements_definitions
    WHERE condition_type = 'livres_objectif'
    LIMIT 1;

    IF achievement_id_v IS NULL THEN
        RETURN;
    END IF;

    -- 2. Boucler sur tous les objectifs des utilisateurs pour l'année ciblée
    FOR rec IN 
        SELECT ug.user_id, ug.target_count, COUNT(b.id) as books_read
        FROM public.user_goals ug
        LEFT JOIN public.books b ON b.user_id = ug.user_id 
            AND b.status = 'Lu'
            -- Filtre sur l'année ciblée (ex: du 01/01/2026 au 31/12/2026)
            AND b.finished_at >= (target_year_v || '-01-01 00:00:00+00')::timestamptz
            AND b.finished_at <= (target_year_v || '-12-31 23:59:59+00')::timestamptz
        WHERE ug.year = target_year_v
        GROUP BY ug.user_id, ug.target_count
    LOOP
        -- 3. Si l'utilisateur a atteint son objectif
        IF rec.books_read >= rec.target_count THEN
            
            -- A. On vérifie s'il n'a pas déjà eu le succès pour cette année-là (sécurité)
            IF NOT EXISTS (
                SELECT 1 FROM public.user_achievements 
                WHERE user_id = rec.user_id 
                  AND achievement_id = achievement_id_v
                  AND extract(year from unlocked_at) = target_year_v
            ) THEN
                
                -- B. Insérer le succès (on fige la date au 31 décembre à 23h59 de l'année ciblée)
                INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
                VALUES (rec.user_id, achievement_id_v, (target_year_v || '-12-31 23:59:00+00')::timestamptz);

                -- C. Mettre à jour l'XP sur le profil
                UPDATE public.profiles
                SET xp = xp + xp_reward_v
                WHERE id = rec.user_id;
                
                -- D. Optionnel : Insérer une ligne dans ton historique d'XP si tu as une table pour ça
                -- INSERT INTO public.xp_history (user_id, amount, reason) ...
                
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer l'extension pg_cron si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planifier la tâche : "5 0 1 1 *" signifie le 1er janvier à 00h05
SELECT cron.schedule(
    'check-yearly-reading-goals', -- Nom unique du cron
    '5 0 1 1 *',                  -- Syntaxe Cron (1er Janvier à 00:05)
    'SELECT check_yearly_goals_cron();'
);