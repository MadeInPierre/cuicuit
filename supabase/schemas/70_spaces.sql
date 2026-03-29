--
-- ==================================================
-- Tables
-- ==================================================
--
--------------------
-- Spaces
--------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."spaces" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "language_id" integer NOT NULL DEFAULT 1,
    "initial_theme" "text" NOT NULL,
    "author_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."spaces"
ADD CONSTRAINT "spaces_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "public"."languages" ("id");

-- 2. Ownership
ALTER TABLE "public"."spaces" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."spaces"
ADD CONSTRAINT "spaces_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."spaces"
ADD CONSTRAINT "spaces_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users" ("id");

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_spaces_updated_at" BEFORE
UPDATE ON "public"."spaces" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."spaces" TO "anon";

GRANT ALL ON TABLE "public"."spaces" TO "authenticated";

GRANT ALL ON TABLE "public"."spaces" TO "service_role";

--------------------
-- Space members
--------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."space_members" (
    "space_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "theme" "text" NOT NULL
);

-- 2. Ownership
ALTER TABLE "public"."space_members" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."space_members"
ADD CONSTRAINT "space_members_pkey" PRIMARY KEY ("space_id", "user_id");

ALTER TABLE ONLY "public"."space_members"
ADD CONSTRAINT "space_members_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces" ("id");

ALTER TABLE ONLY "public"."space_members"
ADD CONSTRAINT "space_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id");

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_space_members_updated_at" BEFORE
UPDATE ON "public"."space_members" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."space_members" TO "anon";

GRANT ALL ON TABLE "public"."space_members" TO "authenticated";

GRANT ALL ON TABLE "public"."space_members" TO "service_role";

--------------------
-- Space plan meals
--------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."space_meals" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" (),
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" (),
    "space_id" "uuid" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "servings" integer DEFAULT 1 NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone
);

-- 2. Ownership
ALTER TABLE "public"."space_meals" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."space_meals"
ADD CONSTRAINT "space_meals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."space_meals"
ADD CONSTRAINT "space_meals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users" ("id");

ALTER TABLE ONLY "public"."space_meals"
ADD CONSTRAINT "space_meals_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."space_meals"
ADD CONSTRAINT "space_meals_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces" ("id") ON DELETE CASCADE;

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_space_meals_updated_at" BEFORE
UPDATE ON "public"."space_meals" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."space_meals" TO "anon";

GRANT ALL ON TABLE "public"."space_meals" TO "authenticated";

GRANT ALL ON TABLE "public"."space_meals" TO "service_role";

--------------------
-- Space plan shopping lists
--------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."space_items" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" (),
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" (),
    "deleted_at" timestamp with time zone,
    "space_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "meal_id" "uuid",
    "meal_origin" "text",
    "ingredient_id" "uuid",
    "quantity" numeric,
    "unit" "text",
    "name" "text",
    "checked_at" timestamp with time zone DEFAULT NULL,
    CONSTRAINT "space_items_check" CHECK (
        (
            (
                ("type" = 'meal'::"text")
                AND ("meal_id" IS NOT NULL)
                AND ("meal_origin" IS NOT NULL)
                AND ("ingredient_id" IS NOT NULL)
            )
            OR (
                ("type" = 'independent'::"text")
                AND ("meal_id" IS NULL)
                AND (
                    ("ingredient_id" IS NOT NULL)
                    OR ("name" IS NOT NULL)
                )
            )
        )
    ),
    CONSTRAINT "space_items_meal_origin_check" CHECK (
        (
            "meal_origin" = ANY (
                ARRAY[
                    'recipe'::"text",
                    'ignored'::"text",
                    'added'::"text"
                ]
            )
        )
    ),
    CONSTRAINT "space_items_type_check" CHECK (
        (
            "type" = ANY (ARRAY['meal'::"text", 'independent'::"text"])
        )
    )
);

-- 2. Ownership
ALTER TABLE "public"."space_items" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."space_items"
ADD CONSTRAINT "space_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."space_items"
ADD CONSTRAINT "space_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users" ("id");

ALTER TABLE ONLY "public"."space_items"
ADD CONSTRAINT "space_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."space_items"
ADD CONSTRAINT "space_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."space_meals" ("id");

ALTER TABLE ONLY "public"."space_items"
ADD CONSTRAINT "space_items_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces" ("id") ON DELETE CASCADE;

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_space_items_updated_at" BEFORE
UPDATE ON "public"."space_items" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."space_items" TO "anon";

GRANT ALL ON TABLE "public"."space_items" TO "authenticated";

GRANT ALL ON TABLE "public"."space_items" TO "service_role";
