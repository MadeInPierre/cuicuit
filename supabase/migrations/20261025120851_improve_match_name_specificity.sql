set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_ingredient(query_text text, lang_code text, n_matches integer DEFAULT 10, is_raw_import boolean DEFAULT false)
 RETURNS SETOF public.ingredients
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    target_lang_id INTEGER;
    ts_config regconfig;
    clean_query TEXT;
    alt_query TEXT;
    prefix_query tsquery;
    fts_query TEXT;
BEGIN
    -- Unknown language: nothing to match.
    SELECT id INTO target_lang_id FROM public.languages WHERE lang = lang_code;
    IF target_lang_id IS NULL THEN RETURN; END IF;

    ts_config := public.ts_config_for_language(lang_code);
    -- Normalise once: lowercase, accent-free and trimmed.
    clean_query := lower(trim(unaccent(query_text)));

    -- Raw imports may start with a quantity ("4 oeufs", "1/2 cup"); drop it.
    IF is_raw_import THEN
        clean_query := regexp_replace(clean_query, '^[0-9\xbc-\xbe/\.,\s]+', '');
    END IF;

    -- Companion singular/plural form, so "oeuf" and "oeufs" rank together.
    alt_query := clean_query;
    IF right(clean_query, 1) = 's' AND length(clean_query) > 2 THEN
        alt_query := left(clean_query, length(clean_query) - 1);
    ELSIF right(clean_query, 2) IN ('al', 'au') THEN
        alt_query := clean_query || 'x';
    ELSIF right(clean_query, 1) <> 's' THEN
        alt_query := clean_query || 's';
    END IF;

    -- Split the query into words, then turn each word into a prefix query.
    -- Example: "fresh milk" becomes "fresh:* & milk:*".
    fts_query := regexp_replace(clean_query, '[^a-z0-9\s]', ' ', 'g');
    fts_query := regexp_replace(fts_query, '\s+', ' ', 'g');
    fts_query := trim(fts_query);

    prefix_query := NULL;
    IF fts_query <> '' THEN
        prefix_query := to_tsquery(ts_config, regexp_replace(fts_query, '\s+', ':* & ', 'g') || ':*');
    END IF;

    RETURN QUERY
    -- Load translations for the requested language only. MATERIALIZED keeps
    -- the table scan (and the synonym unnesting) to a single pass.
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
    -- Score every candidate. Higher is better.
    scored_matches AS (
        SELECT
            t.ingredient_id,
            -- Score tiers: exact name > general name > synonym > prefix > fuzzy.
            CASE
                WHEN t.ns IN (clean_query, alt_query) THEN 120 -- exact name
                WHEN t.ng IN (clean_query, alt_query) THEN 100 -- exact general name
                WHEN clean_query = ANY (t.syns) THEN 98 -- exact synonym
                WHEN t.ns LIKE (clean_query || '%') OR t.ns LIKE (alt_query || '%') THEN 85 -- name prefix
                WHEN t.ng LIKE (clean_query || '%') OR t.ng LIKE (alt_query || '%') THEN 72 -- general-name prefix
                WHEN EXISTS (
                    SELECT 1 FROM unnest(t.syns) AS s
                    WHERE s LIKE (clean_query || '%') OR s LIKE (alt_query || '%')
                ) THEN 78 -- synonym prefix
                WHEN t.fts @@ prefix_query THEN 50 + (ts_rank(t.fts, prefix_query) * 10) -- all words present
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
            -- Tie-breakers, used only when two candidates score the same.
            length(t.name_singular) AS name_length,
            CASE t.commonly_used
                WHEN 'daily' THEN 0
                WHEN 'common' THEN 1
                WHEN 'occasionally' THEN 2
                WHEN 'rare' THEN 3
                WHEN 'never' THEN 4
                ELSE 2
            END AS usage_rank,
            CASE WHEN clean_query LIKE '%' || t.ns || '%' THEN 0 ELSE 1 END AS contained_rank,
            -- Specificity tie-breaker: when several ingredients share the same
            -- exact synonym (e.g. "lamb leg" is listed on every lamb cut), prefer
            -- the one whose own name covers the query terms ("Leg of lamb" over
            -- the generic "Lamb"). It never overrides the relevance score.
            ts_rank(to_tsvector(ts_config, t.ns), prefix_query) AS name_rank
        FROM translations t
        -- Keep only rows with a plausible textual link to the query: exact
        -- names, prefixes, synonyms, full-text hits, substrings or fuzzy hits.
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
    -- Return the full ingredient rows, best match first.
    SELECT i.*
    FROM scored_matches sm
    JOIN public.ingredients i ON i.id = sm.ingredient_id
    -- Relevance wins; name_rank then prefers the most specific matching name
    -- (e.g. "Leg of lamb" over the generic "Lamb" for "lamb leg").
    ORDER BY
        sm.relevance_score DESC,
        sm.name_rank DESC NULLS LAST,
        sm.contained_rank ASC,
        sm.usage_rank ASC,
        sm.name_length ASC,
        i.id ASC
    LIMIT n_matches;
END;
$function$
;
