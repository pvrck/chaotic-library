CREATE OR REPLACE VIEW community_users_list AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.xp,
    p.created_at AS registration_date,
    (
        SELECT GREATEST(MAX(b.added_at), MAX(b.started_at), MAX(b.finished_at))
        FROM public.books b
        WHERE b.user_id = p.id
    ) AS last_activity
FROM public.profiles p;