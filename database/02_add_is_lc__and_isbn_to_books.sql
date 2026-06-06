-- Migration : Ajout de la colonne Lecture Commune
ALTER TABLE public.books ADD COLUMN is_lc BOOLEAN NOT NULL DEFAULT FALSE;

-- Migration : Ajout de la colonne ISBN
ALTER TABLE books ADD COLUMN isbn VARCHAR(20) DEFAULT NULL;

-- Migration : Ajout de la colonne thumbnail
ALTER TABLE books ADD COLUMN thumbnail text DEFAULT NULL;