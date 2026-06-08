-- 1. Permettre aux utilisateurs authentifiés de supprimer leurs propres livres
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres livres" 
ON public.books 
FOR DELETE 
TO authenticated 
USING ( (select auth.uid()) = user_id );