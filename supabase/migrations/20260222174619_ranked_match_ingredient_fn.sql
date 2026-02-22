set
    check_function_bodies = off;

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP FUNCTION IF EXISTS public.match_ingredient (text, text, integer);

CREATE OR REPLACE FUNCTION public.match_ingredient (
    query_text text,
    lang_code text,
    n_matches integer DEFAULT 10,
    is_raw_import boolean DEFAULT false -- New flag to distinguish context
) RETURNS SETOF public.ingredient_translations LANGUAGE plpgsql AS $function$
DECLARE
    target_lang_id INTEGER;
    ts_config regconfig;
    clean_query TEXT;
    prefix_query tsquery;
BEGIN
    -- 1. Setup Language
    SELECT id INTO target_lang_id FROM public.languages WHERE lang = lang_code;
    IF target_lang_id IS NULL THEN RETURN; END IF;

    ts_config := CASE 
        WHEN lang_code LIKE 'fr%' THEN 'french'::regconfig 
        WHEN lang_code LIKE 'en%' THEN 'english'::regconfig 
        ELSE 'simple'::regconfig 
    END;

    -- 2. Pre-processing: unaccent, lowercase, trim whitespace
    clean_query := lower(trim(unaccent(query_text)));

    -- 3. Naive Entity Extraction (For Raw Imports like "4 oeufs")
    -- Strips leading numbers, decimals, fractions, and spaces.
    IF is_raw_import THEN
        clean_query := regexp_replace(clean_query, '^[0-9\xbc-\xbe\/\.,\s]+', '');
    END IF;

    -- 4. Prepare FTS Prefix Query (e.g., 'oeuf:*' or 'creme:* & fraiche:*')
    -- This solves the "jumping around" issue by matching partial words as you type.
    prefix_query := to_tsquery('simple', nullif(regexp_replace(clean_query, '\s+', ':* & ', 'g'), '') || ':*');

    RETURN QUERY
    WITH scored_matches AS (
        SELECT 
            it.ingredient_id,
            CASE 
                -- TIER 1: Exact Match (Score 100)
                WHEN unaccent(lower(name_general)) = clean_query 
                  OR unaccent(lower(name_singular)) = clean_query THEN 100
                
                -- TIER 2: Exact Prefix (Score 80) - Highly stable for UI autocomplete
                WHEN unaccent(lower(name_general)) LIKE (clean_query || '%') THEN 80
                
                -- TIER 3: Word match via FTS Prefix (Score 50 + Rank)
                WHEN fts @@ prefix_query THEN 50 + (ts_rank(fts, prefix_query) * 10)
                
                -- TIER 4: Fuzzy Trigram (Score 0-40)
                ELSE similarity(unaccent(lower(name_general)), clean_query) * 40
            END as relevance_score,
            
            -- Stability Anchor: The length of the ingredient name
            length(name_singular) as name_length
        FROM public.ingredient_translations it
        WHERE language_id = target_lang_id
          AND (
            unaccent(lower(name_general)) LIKE (clean_query || '%')
            OR fts @@ prefix_query
            OR similarity(unaccent(lower(name_general)), clean_query) > 0.3
          )
    )
    SELECT 
        it.*
    FROM scored_matches sm
    JOIN public.ingredient_translations it ON it.ingredient_id = sm.ingredient_id AND it.language_id = target_lang_id
    -- WHERE sm.relevance_score > 15 -- Cutoff threshold to drop pure noise
    ORDER BY 
        sm.relevance_score DESC,   -- Highest semantic score first
        sm.name_length ASC,        -- STABILITY FIX: Always prefer the shorter, simpler word!
        it.name_general ASC        -- Alphabetical tie-breaker
    LIMIT n_matches;
END;
$function$;