CREATE OR REPLACE FUNCTION process_monthly_pal_balance_challenge()
RETURNS void AS $$
DECLARE
    r RECORD;
    books_read_count INTEGER;
    books_added_count INTEGER;
    current_user_xp INTEGER;
    new_user_xp INTEGER;
    xp_diff INTEGER;
    log_reason TEXT;
    start_of_month TIMESTAMP;
    end_of_month TIMESTAMP;
BEGIN
    -- Définition de la période du mois en cours
    start_of_month := date_trunc('month', NOW());
    end_of_month := NOW();

    -- On boucle sur tous les profils utilisateurs actifs
    FOR r IN SELECT id, COALESCE(xp, 0) AS xp FROM profiles
    LOOP
        -- 1. Compter les livres lus (terminés ce mois-ci)
        SELECT COUNT(*) INTO books_read_count
        FROM books
        WHERE user_id = r.id
          AND status IN ('Lu', 'Abandonné')
          AND finished_at >= start_of_month
          AND finished_at <= end_of_month;

        -- 2. Compter les livres ajoutés à la PAL ce mois-ci
        SELECT COUNT(*) INTO books_added_count
        FROM books
        WHERE user_id = r.id
          AND added_at >= start_of_month
          AND added_at <= end_of_month;

        -- 3. Déterminer le bonus ou le malus
        IF books_read_count >= books_added_count THEN
            xp_diff := 250;
            log_reason := '🏆 Bonus Mensuel : PAL maîtrisée ! (' || books_read_count || ' sortis vs ' || books_added_count || ' ajoutés)';
        ELSE
            xp_diff := -400;
            log_reason := '💀 Malus Mensuel : La PAL déborde ! (' || books_read_count || ' sortis vs ' || books_added_count || ' ajoutés)';
        END IF;

        -- 4. Calcul du nouvel XP (sans jamais descendre sous 0)
        new_user_xp := GREATEST(0, r.xp + xp_diff);

        -- 5. Mise à jour de l'xp de l'utilisateur
        PERFORM public.update_xp_with_reason(r.id, new_user_xp, log_reason);

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule(
  'monthly-pal-balance-check',
  '50 23 * * *', -- Tous les jours à 23h50
  $$ SELECT IF (id = 1) THEN expire_overdue_challenges() END IF;
     -- Version Postgres propre pour exécuter SEULEMENT le dernier jour du mois :
     SELECT CASE 
       WHEN EXTRACT(MONTH FROM NOW()) != EXTRACT(MONTH FROM NOW() + INTERVAL '10 minutes') 
       THEN process_monthly_pal_balance_challenge()
     END;
  $$
);