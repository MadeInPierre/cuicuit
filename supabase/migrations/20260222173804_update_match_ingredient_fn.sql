drop function if exists "public"."match_ingredient"(query text, lang text, n_matches integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_ingredient(query_text text, lang_code text, n_matches integer DEFAULT 5)
 RETURNS SETOF public.ingredient_translations
 LANGUAGE plpgsql
AS $function$
DECLARE
    target_lang_id INTEGER;
    ts_config regconfig;
BEGIN
    -- 1. Setup Language
    SELECT id INTO target_lang_id FROM public.languages WHERE lang = lang_code;
    IF target_lang_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Dynamic FTS Dictionary (This fixes the "Oeufs" bug!)
    -- This maps your app's locale string to PostgreSQL's linguistic dictionaries.
    ts_config := CASE
        WHEN lang_code LIKE 'fr%' THEN 'french'::regconfig
        WHEN lang_code LIKE 'en%' THEN 'english'::regconfig
        ELSE 'simple'::regconfig
    END;

    -- STAGE 1: Exact Match (Fastest)
    -- RETURN QUERY executes the SQL and pushes it to the result set. 
    RETURN QUERY
        SELECT * FROM public.ingredient_translations
        WHERE language_id = target_lang_id 
          AND lower(query_text) IN (lower(name_singular), lower(name_plural), lower(name_general))
        ORDER BY LEAST(length(name_singular), length(name_plural), length(name_general)) ASC
        LIMIT n_matches;

    -- 'FOUND' is a special PL/pgSQL variable. If Stage 1 found matches, we exit immediately!
    IF FOUND THEN RETURN; END IF;

    -- STAGE 2: Full-Text Search (Handles native plural stemming!)
    -- Because we use ts_config, "oeufs" will seamlessly match "oeuf".
    RETURN QUERY
        SELECT * FROM public.ingredient_translations
        WHERE language_id = target_lang_id 
          AND fts @@ websearch_to_tsquery(ts_config, query_text)
        ORDER BY ts_rank(fts, websearch_to_tsquery(ts_config, query_text)) DESC,
                 LEAST(length(name_singular), length(name_plural), length(name_general)) ASC
        LIMIT n_matches;

    IF FOUND THEN RETURN; END IF;

    -- STAGE 3: Fuzzy Trigrams (Typo tolerance)
    -- Only trigger this if FTS fails (e.g., severe spelling mistakes like "ouefs")
    RETURN QUERY
        SELECT * FROM public.ingredient_translations
        WHERE language_id = target_lang_id 
          AND (
              similarity(name_singular, query_text) > 0.35 OR
              similarity(name_plural, query_text) > 0.35 OR
              similarity(name_general, query_text) > 0.35
          )
        ORDER BY GREATEST(
            similarity(name_singular, query_text), 
            similarity(name_plural, query_text), 
            similarity(name_general, query_text)
        ) DESC
        LIMIT n_matches;

    RETURN;
END;
$function$
;


