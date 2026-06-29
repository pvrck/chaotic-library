CREATE POLICY "Permettre la lecture des livres à tous les utilisateurs connectés" 
ON public.books 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permettre la lecture des succès à tous les utilisateurs connectés" 
ON public.user_achievements 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permettre la lecture des objectifs à tous les utilisateurs connectés" 
ON public.user_goals 
FOR SELECT 
TO authenticated 
USING (true);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

DROP VIEW IF EXISTS public.community_users_list CASCADE;

CREATE VIEW public.community_users_list AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.xp,
    p.created_at AS registration_date,
    p.is_private,
    -- 1. Calcul dynamique de la dernière activité
    (
        SELECT GREATEST(MAX(b.added_at), MAX(b.started_at), MAX(b.finished_at))
        FROM public.books b
        WHERE b.user_id = p.id
    ) AS last_activity,
    -- 2. Récupération des 3 derniers succès débloqués sous forme de JSON
    (
        SELECT json_agg(row_to_json(sub))
        FROM (
            SELECT ad.id, ad.title, ad.condition_type
            FROM public.user_achievements ua
            JOIN public.achievements_definitions ad ON ad.id = ua.achievement_id
            WHERE ua.user_id = p.id
            ORDER BY ua.unlocked_at DESC
            LIMIT 3
        ) sub
    ) AS latest_achievements
FROM public.profiles p;

GRANT SELECT ON public.community_users_list TO authenticated;