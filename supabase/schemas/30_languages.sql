-- =================================================
-- Table: App-supported Languages
-- =================================================
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."languages" (
    "id" integer NOT NULL,
    "code" character varying(2) NOT NULL,
    "lang" character varying(5) NOT NULL,
    "name_en" character varying(50) NOT NULL,
    "name_local" character varying(50) NOT NULL,
    "country_en" character varying(50) NOT NULL,
    "country_local" character varying(50) NOT NULL,
    "emoji" character varying(10) DEFAULT NULL::character varying,
    CONSTRAINT "languages_check" CHECK (
        (
            (("code")::"text" ~ '^[a-z]{2}$'::"text")
            AND (("lang")::"text" ~ '^[a-z]{2}-[A-Z]{2}$'::"text")
        )
    ),
    CONSTRAINT "languages_check1" CHECK (
        (
            (("name_en")::"text" <> ''::"text")
            AND (("name_local")::"text" <> ''::"text")
            AND (("country_en")::"text" <> ''::"text")
            AND (("country_local")::"text" <> ''::"text")
        )
    )
);

CREATE SEQUENCE IF NOT EXISTS "public"."languages_id_seq" AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- 2. Ownership
ALTER TABLE "public"."languages" OWNER TO "postgres";

ALTER SEQUENCE "public"."languages_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."languages_id_seq" OWNED BY "public"."languages"."id";

-- 3. Constraints (primary key, foreign keys, checks, unique, etc.)
ALTER TABLE ONLY "public"."languages"
ALTER COLUMN "id"
SET DEFAULT "nextval" ('"public"."languages_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."languages"
ADD CONSTRAINT "languages_code_lang_key" UNIQUE ("code", "lang");

ALTER TABLE ONLY "public"."languages"
ADD CONSTRAINT "languages_lang_key" UNIQUE ("lang");

ALTER TABLE ONLY "public"."languages"
ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");

-- 4. Triggers
-- 5. Grants
GRANT ALL ON TABLE "public"."languages" TO "anon";

GRANT ALL ON TABLE "public"."languages" TO "authenticated";

GRANT ALL ON TABLE "public"."languages" TO "service_role";

GRANT ALL ON SEQUENCE "public"."languages_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."languages_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."languages_id_seq" TO "service_role";

-- 6. Indexes