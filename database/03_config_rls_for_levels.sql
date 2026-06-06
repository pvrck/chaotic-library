-- 1. On s'assure que la sécurité RLS est bien activée sur la table
ALTER TABLE public.levels_config ENABLE ROW LEVEL SECURITY;

-- 2. Règle de LECTURE : Tout le monde peut voir les paliers d'XP
CREATE POLICY "Allow public read access" 
ON public.levels_config 
FOR SELECT 
TO public 
USING (true);

-- 3. Règle d'INSERTION : Seuls les admins peuvent ajouter un niveau
CREATE POLICY "Allow admin insert" 
ON public.levels_config 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Règle de MODIFICATION : Seuls les admins peuvent modifier un niveau
CREATE POLICY "Allow admin update" 
ON public.levels_config 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Règle de SUPPRESSION : Seuls les admins peuvent supprimer un niveau
CREATE POLICY "Allow admin delete" 
ON public.levels_config 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);