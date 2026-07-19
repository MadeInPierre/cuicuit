--
-- ==================================================
-- Enums
-- ==================================================
--
-------------------
-- Recipe cleanup level
-------------------
CREATE TYPE "public"."cleanup_level" AS ENUM('none', 'low', 'medium', 'high');

ALTER TYPE "public"."cleanup_level" OWNER TO "postgres";

-------------------
-- Recipe cost level
-------------------
CREATE TYPE "public"."cost_level" AS ENUM('minimal', 'budget', 'average', 'premium');

ALTER TYPE "public"."cost_level" OWNER TO "postgres";

-------------------
-- Recipe course
-------------------
CREATE TYPE "public"."course" AS ENUM(
    'appetizer',
    'main',
    'side',
    'prep',
    'salad',
    'soup',
    'dessert',
    'snack',
    'drink'
);

ALTER TYPE "public"."course" OWNER TO "postgres";

-------------------
-- Recipe cuisine
-------------------
CREATE TYPE "public"."cuisine" AS ENUM(
    'italian',
    'mexican',
    'indian',
    'chinese',
    'french',
    'japanese',
    'mediterranean',
    'american',
    'spanish',
    'thai',
    'greek',
    'korean',
    'vietnamese',
    'middleeast',
    'british',
    'brazilian',
    'caribbean',
    'african'
);

ALTER TYPE "public"."cuisine" OWNER TO "postgres";

-------------------
-- Recipe effort level
-------------------
CREATE TYPE "public"."effort_level" AS ENUM('none', 'low', 'medium', 'high');

ALTER TYPE "public"."effort_level" OWNER TO "postgres";

-------------------
-- Recipe source type
-------------------
CREATE TYPE "public"."recipe_source_type" AS ENUM('website', 'user-manual');

ALTER TYPE "public"."recipe_source_type" OWNER TO "postgres";

-------------------
-- Recipe tools
-------------------
CREATE TYPE "public"."recipe_tool" AS ENUM(
    'blender',
    'fryer',
    'juicer',
    'kettle',
    'microwave',
    'mixer',
    'oven',
    'scale',
    'stove',
    'toaster'
);

ALTER TYPE "public"."recipe_tool" OWNER TO "postgres";

-------------------
-- Recipe skill level
-------------------
CREATE TYPE "public"."skill_level" AS ENUM('beginner', 'intermediate', 'advanced', 'chef');

ALTER TYPE "public"."skill_level" OWNER TO "postgres";

-------------------
-- Recipe time of day
-------------------
CREATE TYPE "public"."time_of_day" AS ENUM(
    'breakfast',
    'brunch',
    'lunch',
    'dinner',
    'dessert',
    'snack',
    'drinks'
);

ALTER TYPE "public"."time_of_day" OWNER TO "postgres";

--
-- ==================================================
-- Tables
-- ==================================================
--
-------------------
-- Recipes
-------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "deleted_at" timestamp with time zone DEFAULT NULL,
    "title" character varying(100) NOT NULL,
    "short_title" character varying(40) NOT NULL,
    "description" "text",
    "notes" "text",
    "image_ids" "text" [],
    "slug" character varying(100) NOT NULL,
    "author_id" "uuid" NOT NULL,
    "language_id" integer NOT NULL,
    "source_type" "public"."recipe_source_type" NOT NULL,
    "source_url" "text",
    "time_prep_minutes" smallint DEFAULT 0,
    "time_cook_minutes" smallint DEFAULT 0,
    "time_rest_minutes" smallint DEFAULT 0,
    "time_total_minutes" smallint GENERATED ALWAYS AS (
        (
            ("time_prep_minutes" + "time_cook_minutes") + "time_rest_minutes"
        )
    ) STORED,
    "effort_level" "public"."effort_level" NOT NULL,
    "skill_level" "public"."skill_level" NOT NULL,
    "cleanup_level" "public"."cleanup_level" NOT NULL,
    "cost_level" "public"."cost_level" NOT NULL,
    "servings" smallint NOT NULL,
    "steps" "text" [],
    "times_of_day" "public"."time_of_day" [] NOT NULL,
    "courses" "public"."course" [] NOT NULL,
    "cuisines" "public"."cuisine" [] NOT NULL,
    "tools" "public"."recipe_tool" [] NOT NULL,
    "search_term" "text",
    CONSTRAINT "chk_courses" CHECK (
        (
            ("array_length" ("courses", 1) > 0)
            OR ("courses" IS NULL)
        )
    ),
    CONSTRAINT "chk_cuisines" CHECK (
        (
            ("array_length" ("cuisines", 1) > 0)
            OR ("cuisines" IS NULL)
        )
    ),
    CONSTRAINT "chk_times_of_day" CHECK (("array_length" ("times_of_day", 1) > 0)),
    CONSTRAINT "chk_tools" CHECK (
        (
            ("array_length" ("tools", 1) > 0)
            OR ("tools" IS NULL)
        )
    ),
    CONSTRAINT "recipes_servings_check" CHECK (("servings" > 0)),
    CONSTRAINT "recipes_time_total_minutes_check" CHECK (("time_total_minutes" >= 0))
);

-- 2. Ownership
ALTER TABLE "public"."recipes" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."recipes"
ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."recipes"
ADD CONSTRAINT "recipes_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."recipes"
ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."recipes"
ADD CONSTRAINT "recipes_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "public"."languages" ("id") ON DELETE CASCADE;

-- 4. Triggers
-- 5. Grants
GRANT ALL ON TABLE "public"."recipes" TO "anon";

GRANT ALL ON TABLE "public"."recipes" TO "authenticated";

GRANT ALL ON TABLE "public"."recipes" TO "service_role";

-- 6. Indexes
CREATE INDEX "idx_recipes_courses" ON "public"."recipes" USING "gin" ("courses");

CREATE INDEX "idx_recipes_cuisines" ON "public"."recipes" USING "gin" ("cuisines");

CREATE INDEX "idx_recipes_skill_level" ON "public"."recipes" USING "btree" ("skill_level");

CREATE INDEX "idx_recipes_times_of_day" ON "public"."recipes" USING "gin" ("times_of_day");

CREATE INDEX "idx_recipes_tools" ON "public"."recipes" USING "gin" ("tools");

CREATE INDEX "idx_recipes_total_time" ON "public"."recipes" USING "btree" ("time_total_minutes");

-------------------
-- Recipes with random order for UI
-------------------
CREATE OR REPLACE VIEW "public"."recipes_randomized" 
WITH (security_invoker = on) AS 
SELECT * FROM "public"."recipes" ORDER BY RANDOM();

-------------------
-- Recipe Ingredients (junction table between recipes and ingredients)
-------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "recipe_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "quantity" numeric(10, 2),
    "unit" character varying(50),
    "notes" "text",
    "details" "text",
    "raw_input" "text" NOT NULL,
    "is_optional" boolean DEFAULT false NOT NULL,
    "preparation" "text",
    CONSTRAINT "recipe_ingredients_details_check" CHECK (("length" ("details") <= 60)),
    CONSTRAINT "recipe_ingredients_raw_input_check" CHECK (("length" ("raw_input") <= 120))
);

-- 2. Ownership
ALTER TABLE "public"."recipe_ingredients" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."recipe_ingredients"
ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("recipe_id", "ingredient_id");

ALTER TABLE ONLY "public"."recipe_ingredients"
ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."recipe_ingredients"
ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id") ON DELETE CASCADE;

-- 4. Triggers
-- 5. Grants
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";

GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";

GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";

-- 6. Indexes
CREATE INDEX "idx_recipe_ingredients_ingredient_id" ON "public"."recipe_ingredients" USING "btree" ("ingredient_id");

--
-- ==================================================
-- Triggers
-- ==================================================
--
-------------------
-- Generate & update the search term column for recipes
-------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."generate_recipe_search_term" () RETURNS "trigger" LANGUAGE "plpgsql" AS $$
BEGIN
    -- Combine title and description, convert to lowercase, remove accents
    NEW.search_term = LOWER(
        UNACCENT(
            COALESCE(NEW.title, '') || ' ' || 
            COALESCE(NEW.description, '')
        )
    );
    RETURN NEW;
END;
$$;

-- 2. Ownership
ALTER FUNCTION "public"."generate_recipe_search_term" () OWNER TO "postgres";

-- 3. Triggers
CREATE OR REPLACE TRIGGER "recipe_search_term_insert_trigger"
BEFORE INSERT ON "public"."recipes" FOR EACH ROW
EXECUTE FUNCTION "public"."generate_recipe_search_term" ();

CREATE OR REPLACE TRIGGER "recipe_search_term_update_trigger"
BEFORE UPDATE ON "public"."recipes" FOR EACH ROW WHEN (
    (
        (
            ("old"."title")::"text" IS DISTINCT FROM ("new"."title")::"text"
        )
        OR (
            "old"."description" IS DISTINCT FROM "new"."description"
        )
    )
)
EXECUTE FUNCTION "public"."generate_recipe_search_term" ();

-- 4. Grants
GRANT ALL ON FUNCTION "public"."generate_recipe_search_term" () TO "anon";

GRANT ALL ON FUNCTION "public"."generate_recipe_search_term" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."generate_recipe_search_term" () TO "service_role";

-------------------
-- Generate & update recipe slugs (uses the recipe's title)
-------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."set_unique_slug_from_name" () RETURNS "trigger" LANGUAGE "plpgsql" AS $$
  DECLARE
      base_slug TEXT;
      new_slug TEXT;
      counter INTEGER := 1;
  BEGIN
      -- Generate the base slug
      base_slug := slugify(NEW.title);
      new_slug := base_slug;

      -- Check if the slug already exists
      WHILE EXISTS (SELECT 1 FROM recipes WHERE slug = new_slug) LOOP
          -- If it exists, append a number and increment
          new_slug := base_slug || '-' || counter;
          counter := counter + 1;
      END LOOP;

      NEW.slug := new_slug;
      RETURN NEW;
  END
$$;

-- 2. Ownership
ALTER FUNCTION "public"."set_unique_slug_from_name" () OWNER TO "postgres";

-- 3. Triggers
CREATE OR REPLACE TRIGGER "recipes_insert_slug"
BEFORE INSERT ON "public"."recipes" FOR EACH ROW WHEN (
    (
        ("new"."title" IS NOT NULL)
        AND (
            ("new"."slug" IS NULL)
            OR (("new"."slug")::"text" = ''::"text")
        )
    )
)
EXECUTE FUNCTION "public"."set_unique_slug_from_name" ();

CREATE OR REPLACE TRIGGER "update_recipes_updated_at"
BEFORE UPDATE ON "public"."recipes" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 4. Grants
GRANT ALL ON FUNCTION "public"."set_unique_slug_from_name" () TO "anon";

GRANT ALL ON FUNCTION "public"."set_unique_slug_from_name" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."set_unique_slug_from_name" () TO "service_role";
