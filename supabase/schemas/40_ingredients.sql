--
-- ==================================================
-- Enums
-- ==================================================
--
-------------------
--  Ingredient commonly used level
-------------------
CREATE TYPE "public"."commonly_used_level" AS ENUM(
    'daily',
    'common',
    'occasionally',
    'rare',
    'never'
);

ALTER TYPE "public"."commonly_used_level" OWNER TO "postgres";

-------------------
--  Ingredient base unit
-------------------
CREATE TYPE "public"."ingredient_base_unit" AS ENUM('g', 'ml', 'unit');

ALTER TYPE "public"."ingredient_base_unit" OWNER TO "postgres";

-------------------
-- Ingredient substitution strength
-------------------
CREATE TYPE "public"."ingredient_substitution_strength" AS ENUM('equivalent', 'close', 'far', 'variant');

ALTER TYPE "public"."ingredient_substitution_strength" OWNER TO "postgres";

-------------------
--  Ingredient supermarket aisle
-------------------
CREATE TYPE "public"."supermarket_aisle" AS ENUM(
    'beverages',
    'bread-pastries',
    'care-health',
    'frozen-convenience',
    'fruits-vegetables',
    'grain-products',
    'home-garden',
    'household',
    'ingredients-spices',
    'meat-fish',
    'milk-cheese',
    'pet-supplies',
    'snacks-sweets',
    'unknown'
);

ALTER TYPE "public"."supermarket_aisle" OWNER TO "postgres";

--
-- ==================================================
-- Tables
-- ==================================================
--
----------------
-- Ingredients
----------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "slug" character varying(50) NOT NULL,
    "slug_general" "text" NOT NULL,
    "aisle" "public"."supermarket_aisle",
    "hierarchy" "text" [] NOT NULL,
    "base_unit" "public"."ingredient_base_unit" NOT NULL,
    "unit_frequencies" "jsonb",
    "g_per_unit" "jsonb",
    "g_per_ml" real,
    "embedding" "extensions"."vector" (1024),
    CONSTRAINT "ingredients_check" CHECK (
        (
            (("slug")::"text" ~ '^[a-z0-9-]+$'::"text")
            AND ("slug_general" ~ '^[a-z0-9-]+$'::"text")
        )
    )
);

-- 2. Ownership
ALTER TABLE "public"."ingredients" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."ingredients"
ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ingredients"
ADD CONSTRAINT "ingredients_slug_key" UNIQUE ("slug");

-- 4. Triggers
-- 5. Grants
GRANT ALL ON TABLE "public"."ingredients" TO "anon";

GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";

GRANT ALL ON TABLE "public"."ingredients" TO "service_role";

-- 6. Indexes
CREATE INDEX "idx_ingredients_aisle" ON "public"."ingredients" USING "btree" ("aisle");

CREATE INDEX "idx_ingredients_slug_general" ON "public"."ingredients" USING "btree" ("slug_general");

----------------
-- Ingredient Translations 
----------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."ingredient_translations" (
    "ingredient_id" "uuid" NOT NULL,
    "language_id" integer NOT NULL,
    "name_singular" character varying(255),
    "name_plural" character varying(255),
    "name_general" character varying(255) NOT NULL,
    "commonly_used" "public"."commonly_used_level" DEFAULT 'occasionally'::"public"."commonly_used_level" NOT NULL,
    "fts" "tsvector",
    CONSTRAINT "ingredient_translations_check" CHECK (
        (
            (("name_singular")::"text" <> ''::"text")
            AND (("name_plural")::"text" <> ''::"text")
            AND (("name_general")::"text" <> ''::"text")
        )
    )
);

-- 2. Ownership
ALTER TABLE "public"."ingredient_translations" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."ingredient_translations"
ADD CONSTRAINT "ingredient_translations_pkey" PRIMARY KEY ("ingredient_id", "language_id");

ALTER TABLE ONLY "public"."ingredient_translations"
ADD CONSTRAINT "ingredient_translations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ingredient_translations"
ADD CONSTRAINT "ingredient_translations_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "public"."languages" ("id");

-- 4. Triggers
-- 5. Grants
GRANT ALL ON TABLE "public"."ingredient_translations" TO "anon";

GRANT ALL ON TABLE "public"."ingredient_translations" TO "authenticated";

GRANT ALL ON TABLE "public"."ingredient_translations" TO "service_role";

-- 6. Indexes
CREATE INDEX "ingredients_fts_idx" ON "public"."ingredient_translations" USING "gin" ("fts");

CREATE INDEX "ingredients_trgm_idx" ON "public"."ingredient_translations" USING "gin" (
    "name_singular" "extensions"."gin_trgm_ops",
    "name_plural" "extensions"."gin_trgm_ops",
    "name_general" "extensions"."gin_trgm_ops"
);

----------------
-- Ingredient Substitutions
----------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."ingredient_substitutions" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "original_ingredient_id" "uuid" NOT NULL,
    "substitute_ingredient_id" "uuid" NOT NULL,
    "strength" "public"."ingredient_substitution_strength" NOT NULL,
    "original_to_substitute_ratio" numeric(10, 5) DEFAULT 1.00000 NOT NULL,
    CONSTRAINT "ingredient_substitutions_check" CHECK (
        (
            "original_ingredient_id" <> "substitute_ingredient_id"
        )
    ),
    CONSTRAINT "ingredient_substitutions_original_to_substitute_ratio_check" CHECK (("original_to_substitute_ratio" > (0)::numeric))
);

-- 2. Ownership
ALTER TABLE "public"."ingredient_substitutions" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."ingredient_substitutions"
ADD CONSTRAINT "ingredient_substitutions_original_ingredient_id_substitute__key" UNIQUE (
    "original_ingredient_id",
    "substitute_ingredient_id",
    "strength"
);

ALTER TABLE ONLY "public"."ingredient_substitutions"
ADD CONSTRAINT "ingredient_substitutions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ingredient_substitutions"
ADD CONSTRAINT "ingredient_substitutions_original_ingredient_id_fkey" FOREIGN KEY ("original_ingredient_id") REFERENCES "public"."ingredients" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ingredient_substitutions"
ADD CONSTRAINT "ingredient_substitutions_substitute_ingredient_id_fkey" FOREIGN KEY ("substitute_ingredient_id") REFERENCES "public"."ingredients" ("id") ON DELETE CASCADE;

-- 4. Triggers
-- 4.1. Update Full-Text-Search internal index column on ingredient translations
-- 4.1.1. Definition
CREATE OR REPLACE FUNCTION "public"."update_ingredient_fts" () RETURNS "trigger" LANGUAGE "plpgsql" SET search_path = public AS $$
BEGIN
    NEW.fts := to_tsvector('english',
        coalesce(NEW.name_singular, '') || ' ' ||
        coalesce(NEW.name_plural, '') || ' ' ||
        coalesce(NEW.name_general, '')
    );
    RETURN NEW;
END;
$$;

-- 4.1.2. Ownership
ALTER FUNCTION "public"."update_ingredient_fts" () OWNER TO "postgres";

-- 4.1.3. Constraints
-- 4.1.4. Triggers
CREATE OR REPLACE TRIGGER "ingredient_translations_fts_update" BEFORE INSERT
OR
UPDATE ON "public"."ingredient_translations" FOR EACH ROW
EXECUTE FUNCTION "public"."update_ingredient_fts" ();

-- 4.1.5. Grants
GRANT ALL ON FUNCTION "public"."update_ingredient_fts" () TO "anon";

GRANT ALL ON FUNCTION "public"."update_ingredient_fts" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_ingredient_fts" () TO "service_role";

-- 5. Grants
GRANT ALL ON TABLE "public"."ingredient_substitutions" TO "anon";

GRANT ALL ON TABLE "public"."ingredient_substitutions" TO "authenticated";

GRANT ALL ON TABLE "public"."ingredient_substitutions" TO "service_role";

-- 6. Indexes
CREATE INDEX "idx_ingredient_substitutions_original" ON "public"."ingredient_substitutions" USING "btree" ("original_ingredient_id");

CREATE INDEX "idx_ingredient_substitutions_strength" ON "public"."ingredient_substitutions" USING "btree" ("strength");

--
-- ==================================================
-- Functions
-- ==================================================
--
----------------
-- Match Ingredient Function
----------------
-- 1. Definition
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

-- 2. Ownership
ALTER FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer,
    "is_raw_import" boolean
) OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer,
    "is_raw_import" boolean
) TO "anon";

GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer,
    "is_raw_import" boolean
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer,
    "is_raw_import" boolean
) TO "service_role";
