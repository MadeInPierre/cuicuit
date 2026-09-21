-- Per-language ingredient full-text search.
--
-- Before this migration every `ingredient_translations.fts` vector was built
-- with the english text-search configuration and `match_ingredient` queried
-- with `simple`, so non-English languages (de, es, it, nl, pt, ...) matched
-- with degraded stemming on both sides.
--
-- `ts_config_for_language` maps an app language (BCP47 like 'de-DE' or bare
-- 'de') to its Postgres dictionary and falls back to 'simple', so future
-- languages work with zero SQL changes. Both the FTS trigger and
-- `match_ingredient` use it, keeping indexed vectors and queries consistent.

-- 1. Language -> text-search configuration mapping.
CREATE OR REPLACE FUNCTION public.ts_config_for_language(lang_code text)
 RETURNS regconfig
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'extensions'
AS $function$
    SELECT CASE lower(split_part(coalesce(lang_code, ''), '-', 1))
        WHEN 'ar' THEN 'arabic'::regconfig
        WHEN 'hy' THEN 'armenian'::regconfig
        WHEN 'eu' THEN 'basque'::regconfig
        WHEN 'ca' THEN 'catalan'::regconfig
        WHEN 'da' THEN 'danish'::regconfig
        WHEN 'nl' THEN 'dutch'::regconfig
        WHEN 'en' THEN 'english'::regconfig
        WHEN 'fi' THEN 'finnish'::regconfig
        WHEN 'fr' THEN 'french'::regconfig
        WHEN 'de' THEN 'german'::regconfig
        WHEN 'el' THEN 'greek'::regconfig
        WHEN 'hi' THEN 'hindi'::regconfig
        WHEN 'hu' THEN 'hungarian'::regconfig
        WHEN 'id' THEN 'indonesian'::regconfig
        WHEN 'ga' THEN 'irish'::regconfig
        WHEN 'it' THEN 'italian'::regconfig
        WHEN 'lt' THEN 'lithuanian'::regconfig
        WHEN 'ne' THEN 'nepali'::regconfig
        WHEN 'nb' THEN 'norwegian'::regconfig
        WHEN 'nn' THEN 'norwegian'::regconfig
        WHEN 'no' THEN 'norwegian'::regconfig
        WHEN 'pt' THEN 'portuguese'::regconfig
        WHEN 'ro' THEN 'romanian'::regconfig
        WHEN 'ru' THEN 'russian'::regconfig
        WHEN 'sr' THEN 'serbian'::regconfig
        WHEN 'es' THEN 'spanish'::regconfig
        WHEN 'sv' THEN 'swedish'::regconfig
        ELSE 'simple'::regconfig
    END;
$function$;

ALTER FUNCTION "public"."ts_config_for_language" ("text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."ts_config_for_language" ("text") TO "anon";

GRANT ALL ON FUNCTION "public"."ts_config_for_language" ("text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."ts_config_for_language" ("text") TO "service_role";

-- 2. `match_ingredient`: resolve the query config per language instead of
-- fr/en-only with a `simple` fallback.
CREATE OR REPLACE FUNCTION public.match_ingredient(query_text text, lang_code text, n_matches integer DEFAULT 10, is_raw_import boolean DEFAULT false)
 RETURNS SETOF public.ingredients
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
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

    ts_config := public.ts_config_for_language(lang_code);

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
        prefix_query := to_tsquery(ts_config, regexp_replace(fts_query, '\s+', ':* & ', 'g') || ':*');
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

-- 3. FTS trigger: build each row's vector with its own language config.
CREATE OR REPLACE FUNCTION public.update_ingredient_fts()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    lang_code TEXT;
BEGIN
    SELECT l.code INTO lang_code FROM public.languages l WHERE l.id = NEW.language_id;
    NEW.fts := to_tsvector(public.ts_config_for_language(lang_code),
        coalesce(NEW.name_singular, '') || ' ' ||
        coalesce(NEW.name_plural, '') || ' ' ||
        coalesce(NEW.name_general, '')
    );
    RETURN NEW;
END;
$function$;

-- 4. Data backfill: rebuild every fts vector with its language config
-- (fires the trigger above; no value actually changes).
UPDATE public.ingredient_translations SET name_general = name_general;
