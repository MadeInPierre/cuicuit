set
    check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_ingredient (
    query_text text,
    lang_code text,
    n_matches integer DEFAULT 10,
    is_raw_import boolean DEFAULT false
) RETURNS SETOF public.ingredients LANGUAGE plpgsql AS $function$
DECLARE
    target_lang_id INTEGER;
    ts_config regconfig;
    clean_query TEXT;
    alt_query TEXT; -- plural/singular companion form
    prefix_query tsquery;
    fts_query TEXT; -- New variable for sanitized FTS input
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

    -- Build a singular/plural companion query for ranking stability (e.g. oeuf <-> oeufs)
    alt_query := clean_query;
    IF right(clean_query, 1) = 's' AND length(clean_query) > 2 THEN
        alt_query := left(clean_query, length(clean_query) - 1);
    ELSIF right(clean_query, 2) IN ('al', 'au') THEN
        alt_query := clean_query || 'x';
    ELSIF right(clean_query, 1) <> 's' THEN
        alt_query := clean_query || 's';
    END IF;

    -- 4. Prepare FTS Prefix Query (e.g., 'oeuf:*' or 'creme:* & fraiche:*')
    -- This solves the "jumping around" issue by matching partial words as you type.
    
    -- Strip all non-alphanumeric characters (except spaces) to prevent to_tsquery syntax errors
    fts_query := regexp_replace(clean_query, '[^a-z0-9\s]', ' ', 'g');
    fts_query := regexp_replace(fts_query, '\s+', ' ', 'g');
    fts_query := trim(fts_query);

    prefix_query := NULL;
    IF fts_query <> '' THEN
        prefix_query := to_tsquery('simple', regexp_replace(fts_query, '\s+', ':* & ', 'g') || ':*');
    END IF;

    RETURN QUERY
    WITH scored_matches AS (
        SELECT 
            it.ingredient_id,
            CASE
                -- Exact match: favor singular/plural-facing names over general names
                WHEN unaccent(lower(name_singular)) IN (clean_query, alt_query) THEN 110
                WHEN unaccent(lower(name_general)) IN (clean_query, alt_query) THEN 95

                -- Prefix match: favor singular/plural-facing names over general names
                WHEN unaccent(lower(name_singular)) LIKE (clean_query || '%')
                  OR unaccent(lower(name_singular)) LIKE (alt_query || '%') THEN 85
                WHEN unaccent(lower(name_general)) LIKE (clean_query || '%')
                  OR unaccent(lower(name_general)) LIKE (alt_query || '%') THEN 72

                WHEN fts @@ prefix_query THEN 50 + (ts_rank(fts, prefix_query) * 10)

                ELSE GREATEST(
                    -- Slight penalty on name_general similarity so singular/plural wins ties
                    similarity(unaccent(lower(name_general)), clean_query) * 0.90,
                    similarity(unaccent(lower(name_general)), alt_query) * 0.90,
                    similarity(unaccent(lower(name_singular)), clean_query),
                    similarity(unaccent(lower(name_singular)), alt_query)
                ) * 40
            END as relevance_score,
            length(name_singular) as name_length
        FROM public.ingredient_translations it
        WHERE language_id = target_lang_id
          AND (
            unaccent(lower(name_general)) LIKE (clean_query || '%')
            OR unaccent(lower(name_general)) LIKE (alt_query || '%')
            OR unaccent(lower(name_singular)) LIKE (clean_query || '%')
            OR unaccent(lower(name_singular)) LIKE (alt_query || '%')
            OR fts @@ prefix_query
            OR GREATEST(
                similarity(unaccent(lower(name_general)), clean_query) * 0.90,
                similarity(unaccent(lower(name_general)), alt_query) * 0.90,
                similarity(unaccent(lower(name_singular)), clean_query),
                similarity(unaccent(lower(name_singular)), alt_query)
            ) > 0.3
          )
    )
    SELECT 
        i.*
    FROM scored_matches sm
    JOIN public.ingredients i ON i.id = sm.ingredient_id
    ORDER BY 
        sm.relevance_score DESC,
        sm.name_length ASC,
        i.id ASC
    LIMIT n_matches;
END;
$function$;
