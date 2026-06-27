CREATE OR REPLACE FUNCTION expire_overdue_chaos_challenges()
RETURNS void AS $$
DECLARE
    r RECORD;
    current_user_xp INTEGER;
    new_user_xp INTEGER;
BEGIN
    -- 1. On boucle sur tous les défis du Chaos "en_cours" qui ont expiré
    FOR r IN 
        SELECT 
            uc.id AS user_challenge_id,
            uc.user_id,
            cp.title,
            COALESCE(cp.xp_malus, 0) AS malus
        FROM user_challenges uc
        JOIN challenge_pool cp ON uc.challenge_id = cp.id
        WHERE uc.status = 'en_cours'
          AND cp.type = 'chaos'
          AND uc.expires_at < NOW()
    LOOP
        -- 2. Passer le statut du défi à "échoué"
        UPDATE user_challenges 
        SET 
            status = 'echoue',
            completed_at = NOW()
        WHERE id = r.user_challenge_id;

        -- 3. Récupérer l'XP actuel de l'utilisateur ciblé
        SELECT COALESCE(xp, 0) INTO current_user_xp 
        FROM profiles 
        WHERE id = r.user_id;

        -- 4. Soustraire le malus (sans jamais descendre sous 0 XP)
        new_user_xp := GREATEST(0, current_user_xp - r.malus);

        -- 5. Mettre à jour le profil de l'utilisateur
        UPDATE profiles 
        SET xp = new_user_xp 
        WHERE id = r.user_id;

        -- 6. (Optionnel) Si tu as une table d'historique d'XP, tu peux insérer une ligne ici
        INSERT INTO xp_history (user_id, amount, reason, created_at) 
        VALUES (r.user_id, -r.malus, 'Défi du chaos expiré : ' || r.title, NOW());

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule(
  'expire-chaos-challenges-hourly', -- Nom unique du job
  '0 * * * *',                       -- Expression Cron (Toutes les heures)
  'SELECT expire_overdue_chaos_challenges();'
);