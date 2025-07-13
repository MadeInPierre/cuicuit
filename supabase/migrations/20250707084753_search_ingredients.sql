-- Enable the pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a dedicated column to store the vector for full-text search
ALTER TABLE public.ingredient_translations ADD COLUMN fts tsvector;

-- Create a function that will automatically update the `fts` column
-- This function combines our key text fields into one searchable vector
CREATE OR REPLACE FUNCTION update_ingredient_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts := to_tsvector('english',
        coalesce(NEW.name_singular, '') || ' ' ||
        coalesce(NEW.name_plural, '') || ' ' ||
        coalesce(NEW.name_general, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs the function whenever an ingredient is created or updated
CREATE TRIGGER ingredient_translations_fts_update
BEFORE INSERT OR UPDATE ON public.ingredient_translations
FOR EACH ROW EXECUTE FUNCTION update_ingredient_fts();

-- Manually populate the `fts` for existing rows in your table
UPDATE public.ingredient_translations SET fts = to_tsvector('english',
    coalesce(name_singular, '') || ' ' ||
    coalesce(name_plural, '') || ' ' ||
    coalesce(name_general, '')
);

-- Create indexes for performance
-- A GIN index is ideal for full-text search
CREATE INDEX ingredients_fts_idx ON public.ingredient_translations USING gin(fts);

-- A GIN index using trigrams is ideal for fuzzy search on multiple columns
CREATE INDEX ingredients_trgm_idx ON public.ingredient_translations USING gin (name_singular gin_trgm_ops, name_plural gin_trgm_ops, name_general gin_trgm_ops);


---------------------


-- The main function to match an ingredient string
-- Returns the best-matching row from public.ingredient_translations for the given query and language.
-- Matching proceeds in three stages:
--   1. Exact (case-insensitive) match on name_singular, name_plural, or name_general.
--   2. Full-text search using the fts column.
--   3. Fuzzy trigram similarity on the name fields, with a minimum similarity threshold.
-- Returns an empty set if no suitable match is found.
--
-- Parameters:
--   query TEXT: The ingredient name or phrase to search for.
--   lang TEXT: The language code (e.g., 'en', 'fr') to restrict the search.
-- Returns:
--   SETOF public.ingredient_translations: The best-matching ingredient translation row(s), or empty set if no match.
CREATE OR REPLACE FUNCTION match_ingredient(query TEXT, lang TEXT, n_matches INT DEFAULT 5)
RETURNS SETOF public.ingredient_translations AS $$
DECLARE
    l_id INTEGER := (SELECT id FROM public.languages AS l WHERE l.lang = match_ingredient.lang);
    match_found BOOLEAN := FALSE;
    similarity_threshold FLOAT := 0.35; -- set your desired threshold here
    result public.ingredient_translations%ROWTYPE;
    matches RECORD;
BEGIN
    -- If the language is not found, return immediately
    IF l_id IS NULL THEN
        RETURN;
    END IF;


    -- Stage 1: Exact match on name_singular, name_plural, or name_general
    FOR matches IN
        SELECT *
        FROM public.ingredient_translations
        WHERE
            public.ingredient_translations.language_id = l_id AND
            lower(query) IN (lower(name_singular), lower(name_plural), lower(name_general))
        ORDER BY LEAST(length(name_singular), length(name_plural), length(name_general)) ASC
        LIMIT n_matches
    LOOP
        match_found := TRUE;
        RETURN NEXT matches;
    END LOOP;


    -- Stage 2: If no exact match, use Full-Text Search
    IF NOT match_found THEN
        FOR matches IN
            SELECT *
            FROM public.ingredient_translations
            WHERE
                public.ingredient_translations.language_id = l_id AND
                fts @@ websearch_to_tsquery('english', query)
            ORDER BY
                ts_rank(fts, websearch_to_tsquery('english', query)) DESC,
                LEAST(length(name_singular), length(name_plural), length(name_general)) ASC
            LIMIT n_matches
        LOOP
            match_found := TRUE;
            RETURN NEXT matches;
        END LOOP;
    END IF;


    -- Stage 3: If still no match, use fuzzy trigram similarity
    IF NOT match_found THEN
        FOR matches IN
            SELECT *
            FROM public.ingredient_translations
            WHERE
                public.ingredient_translations.language_id = l_id 
            ORDER BY
                greatest(
                    similarity(name_singular, query),
                    similarity(name_plural, query),
                    similarity(name_general, query)
                ) DESC,
                LEAST(length(name_singular), length(name_plural), length(name_general)) ASC
            LIMIT n_matches
        LOOP
            -- We require a minimum similarity threshold to avoid bad matches
            IF greatest(similarity(matches.name_singular, query), similarity(matches.name_plural, query), similarity(matches.name_general, query)) > similarity_threshold THEN
                RETURN NEXT matches;
            END IF;
        END LOOP;
    END IF;

    -- If no match is found at any stage, the function returns an empty set
    RETURN;
END;
$$ LANGUAGE plpgsql;
