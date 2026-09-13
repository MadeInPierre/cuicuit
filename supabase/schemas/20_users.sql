-- =================================================
-- Table: User Preferences
-- =================================================
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "onboarding_status" "text" DEFAULT 'not-started'::"text" NOT NULL,
    "aisle_order" "text"[]
);

-- 2. Ownership
ALTER TABLE "public"."user_preferences" OWNER TO "postgres";

-- 3. Constraints (primary key, foreign keys, checks, unique, etc.)
ALTER TABLE ONLY "public"."user_preferences"
ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."user_preferences"
ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id");

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE
UPDATE ON "public"."user_preferences" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."user_preferences" TO "anon";

GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";

GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";

-- 6. Indexes

-- =================================================
-- Trigger function: create onboarding data for new auth users
-- =================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_space_id uuid;
    v_role text;
BEGIN
    -- First ever user becomes admin (self-hostable instances), all others are regular users.
    -- NOTE: concurrent first signups could both see an empty table; acceptable for this app scale.
    SELECT CASE WHEN EXISTS (SELECT 1 FROM public.user_permissions) THEN 'user' ELSE 'admin' END
    INTO v_role;

    INSERT INTO public.user_permissions (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id, first_name, last_name, onboarding_status)
    VALUES (
        NEW.id,
        'Birdie',
        '',
        'not-started'
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_public_profiles (user_id, user_name, icon)
    VALUES (
        NEW.id,
        'birdie' || floor(random() * 10000)::int,
        'bird'
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.spaces (name, icon, initial_theme, author_id)
    VALUES (
        'Birdie''s Home',
        'house',
        'yellow',
        NEW.id
    )
    RETURNING id INTO v_space_id;

    INSERT INTO public.space_members (space_id, user_id, theme)
    VALUES (
        v_space_id,
        NEW.id,
        'yellow'
    );

    RETURN NEW;
END;
$$;

-- Trigger-only function: revoke EXECUTE from PUBLIC/anon/authenticated (fired via
-- trigger without runtime EXECUTE checks, so it still runs on auth.users insert).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =================================================
-- Table: User Public Profiles
-- =================================================
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."user_public_profiles" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "user_name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "image_url" "text"
);

-- 2. Ownership
ALTER TABLE "public"."user_public_profiles" OWNER TO "postgres";

-- 3. Constraints (primary key, foreign keys, checks, unique, etc.)
ALTER TABLE ONLY "public"."user_public_profiles"
ADD CONSTRAINT "user_public_profiles_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."user_public_profiles"
ADD CONSTRAINT "user_public_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id");

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_user_public_profiles_updated_at" BEFORE
UPDATE ON "public"."user_public_profiles" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."user_public_profiles" TO "anon";

GRANT ALL ON TABLE "public"."user_public_profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."user_public_profiles" TO "service_role";

-- 6. Indexes

-- =================================================
-- Table: User Permissions
-- =================================================
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    CONSTRAINT "user_permissions_role_check" CHECK ("role" IN ('admin', 'user'))
);

-- 2. Ownership
ALTER TABLE "public"."user_permissions" OWNER TO "postgres";

-- 3. Constraints (primary key, foreign keys, checks, unique, etc.)
ALTER TABLE ONLY "public"."user_permissions"
ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."user_permissions"
ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE;

-- 4. Triggers
CREATE OR REPLACE TRIGGER "update_user_permissions_updated_at" BEFORE
UPDATE ON "public"."user_permissions" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- 5. Grants
GRANT ALL ON TABLE "public"."user_permissions" TO "anon";

GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";

GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";

-- 6. Indexes