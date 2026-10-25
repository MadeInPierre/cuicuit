set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_ingredient (
    query_text text,
    lang_code text,
    n_matches integer DEFAULT 10,
    is_raw_import boolean DEFAULT false
) RETURNS SETOF public.ingredients LANGUAGE plpgsql SET search_path = public, extensions AS $function$
DECLARE
    target_lang_id INTEGER;
    ts_config regconfig;
    clean_query TEXT;
    alt_query TEXT;
    prefix_query tsquery;
    fts_query TEXT;
BEGIN
    SELECT id INTO target_lang_id FROM public.languages WHERE lang = lang_code;
    IF target_lang_id IS NULL THEN RETURN; END IF;

    ts_config := public.ts_config_for_language(lang_code);
    clean_query := lower(trim(unaccent(query_text)));

    IF is_raw_import THEN
        clean_query := regexp_replace(clean_query, '^[0-9\xbc-\xbe/\.,\s]+', '');
    END IF;

    alt_query := clean_query;
    IF right(clean_query, 1) = 's' AND length(clean_query) > 2 THEN
        alt_query := left(clean_query, length(clean_query) - 1);
    ELSIF right(clean_query, 2) IN ('al', 'au') THEN
        alt_query := clean_query || 'x';
    ELSIF right(clean_query, 1) <> 's' THEN
        alt_query := clean_query || 's';
    END IF;

    fts_query := regexp_replace(clean_query, '[^a-z0-9\s]', ' ', 'g');
    fts_query := regexp_replace(fts_query, '\s+', ' ', 'g');
    fts_query := trim(fts_query);

    prefix_query := NULL;
    IF fts_query <> '' THEN
        prefix_query := to_tsquery(ts_config, regexp_replace(fts_query, '\s+', ':* & ', 'g') || ':*');
    END IF;

    RETURN QUERY
    WITH translations AS MATERIALIZED (
        SELECT
            it.ingredient_id,
            it.fts,
            it.commonly_used,
            it.name_singular,
            unaccent(lower(it.name_singular)) AS ns,
            unaccent(lower(it.name_general)) AS ng,
            ARRAY(
                SELECT unaccent(lower(x))
                FROM unnest(COALESCE(it.synonyms, '{}'::text[])) AS x
            ) AS syns
        FROM public.ingredient_translations it
        WHERE it.language_id = target_lang_id
    ),
    scored_matches AS (
        SELECT
            t.ingredient_id,
            CASE
                WHEN t.ns IN (clean_query, alt_query) THEN 120
                WHEN t.ng IN (clean_query, alt_query) THEN 100
                WHEN clean_query = ANY (t.syns) THEN 98
                WHEN t.ns LIKE (clean_query || '%') OR t.ns LIKE (alt_query || '%') THEN 85
                WHEN t.ng LIKE (clean_query || '%') OR t.ng LIKE (alt_query || '%') THEN 72
                WHEN EXISTS (
                    SELECT 1 FROM unnest(t.syns) AS s
                    WHERE s LIKE (clean_query || '%') OR s LIKE (alt_query || '%')
                ) THEN 78
                WHEN t.fts @@ prefix_query THEN 50 + (ts_rank(t.fts, prefix_query) * 10)
                ELSE GREATEST(
                    similarity(t.ng, clean_query) * 0.90,
                    similarity(t.ng, alt_query) * 0.90,
                    similarity(t.ns, clean_query),
                    similarity(t.ns, alt_query),
                    word_similarity(t.ng, clean_query),
                    word_similarity(t.ns, clean_query),
                    CASE WHEN clean_query LIKE '%' || t.ns || '%' THEN 0.60::real ELSE 0::real END,
                    CASE WHEN clean_query LIKE '%' || t.ng || '%' THEN 0.55::real ELSE 0::real END,
                    COALESCE((
                        SELECT max(CASE WHEN clean_query LIKE '%' || s || '%' THEN 0.62::real ELSE 0::real END)
                        FROM unnest(t.syns) AS s
                    ), 0::real)
                ) * 40
            END AS relevance_score,
            length(t.name_singular) AS name_length,
            CASE t.commonly_used
                WHEN 'daily' THEN 0
                WHEN 'common' THEN 1
                WHEN 'occasionally' THEN 2
                WHEN 'rare' THEN 3
                WHEN 'never' THEN 4
                ELSE 2
            END AS usage_rank,
            CASE WHEN clean_query LIKE '%' || t.ns || '%' THEN 0 ELSE 1 END AS contained_rank
        FROM translations t
        WHERE
            t.ns IN (clean_query, alt_query)
            OR t.ng IN (clean_query, alt_query)
            OR clean_query = ANY (t.syns)
            OR t.ns LIKE (clean_query || '%')
            OR t.ns LIKE (alt_query || '%')
            OR t.ng LIKE (clean_query || '%')
            OR t.ng LIKE (alt_query || '%')
            OR EXISTS (
                SELECT 1 FROM unnest(t.syns) AS s
                WHERE s LIKE (clean_query || '%') OR s LIKE (alt_query || '%')
            )
            OR t.fts @@ prefix_query
            OR clean_query LIKE '%' || t.ns || '%'
            OR clean_query LIKE '%' || t.ng || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(t.syns) AS s
                WHERE clean_query LIKE '%' || s || '%'
            )
            OR GREATEST(
                similarity(t.ng, clean_query) * 0.90,
                similarity(t.ng, alt_query) * 0.90,
                similarity(t.ns, clean_query),
                similarity(t.ns, alt_query),
                word_similarity(t.ng, clean_query),
                word_similarity(t.ns, clean_query)
            ) > 0.3
    )
    SELECT i.*
    FROM scored_matches sm
    JOIN public.ingredients i ON i.id = sm.ingredient_id
    ORDER BY
        sm.relevance_score DESC,
        sm.contained_rank ASC,
        sm.usage_rank ASC,
        sm.name_length ASC,
        i.id ASC
    LIMIT n_matches;
END;
$function$;
