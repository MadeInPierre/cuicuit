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
    "embedding" "public"."vector" (1024),
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
    "name_singular" "public"."gin_trgm_ops",
    "name_plural" "public"."gin_trgm_ops",
    "name_general" "public"."gin_trgm_ops"
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
CREATE OR REPLACE FUNCTION "public"."update_ingredient_fts" () RETURNS "trigger" LANGUAGE "plpgsql" AS $$
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
CREATE OR REPLACE FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer DEFAULT 5
) RETURNS SETOF "public"."ingredient_translations" LANGUAGE "plpgsql" AS $$
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
$$;

-- 2. Ownership
ALTER FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer
) OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer
) TO "anon";

GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."match_ingredient" (
    "query" "text",
    "lang" "text",
    "n_matches" integer
) TO "service_role";
