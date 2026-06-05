-- Migration : Ajout de la colonne Lecture Commune
ALTER TABLE public.books ADD COLUMN is_lc BOOLEAN NOT NULL DEFAULT FALSE;