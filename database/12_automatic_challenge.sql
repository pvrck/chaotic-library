ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- On ajoute une colonne JSONB pour stocker ta structure ChallengeCondition
ALTER TABLE challenge_pool ADD COLUMN IF NOT EXISTS condition JSONB;

ALTER TYPE challenge_status ADD VALUE IF NOT EXISTS 'expire';

CREATE OR REPLACE FUNCTION reset_monthly_challenges() 
RETURNS void AS $$
DECLARE
  u_id uuid;
  uc_record record;
  malus_amount int;
BEGIN
  -- 1. Appliquer les malus et marquer comme 'expire'
  FOR uc_record IN 
    SELECT uc.id, uc.user_id, cp.xp_malus 
    FROM user_challenges uc
    JOIN challenge_pool cp ON uc.challenge_id = cp.id
    WHERE cp.type = 'mensuel' 
    AND uc.status = 'en_cours'
  LOOP
    -- Appliquer le malus au profil de l'utilisateur
    UPDATE profiles 
    SET xp = GREATEST(0, xp - uc_record.xp_malus) 
    WHERE id = uc_record.user_id;

    -- Marquer le défi comme expiré
    UPDATE user_challenges 
    SET status = 'expire' 
    WHERE id = uc_record.id;
  END LOOP;

  -- 2. Pour chaque utilisateur, assigner 3 nouveaux défis mensuels
  FOR u_id IN SELECT id FROM profiles LOOP
    INSERT INTO user_challenges (user_id, challenge_id, status, activated_at) 
    SELECT u_id, id, 'en_cours', now()
    FROM challenge_pool
    WHERE type = 'mensuel'
    ORDER BY random()
    LIMIT 3;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Active l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'reset-monthly-challenges-job', -- Nom du job
  '0 0 1 * *',                   -- Cron syntaxe: 00:00 le 1er de chaque mois
  'SELECT reset_monthly_challenges()'
);