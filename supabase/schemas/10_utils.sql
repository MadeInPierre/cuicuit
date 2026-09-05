-- ==================================================
-- Utility functions for various purposes in the rest of the database
-- ==================================================
--
--
-----------------------------------
-- Slugify function to create URL-friendly slugs from text values such as recipe titles
-----------------------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."slugify" ("value" "text", "max_length" integer DEFAULT 80) RETURNS "text" LANGUAGE "sql" IMMUTABLE STRICT SET search_path = public, extensions AS $_$
  -- removes accents (diacritic signs) from a given string --
  WITH "unaccented" AS (
    SELECT unaccent("value") AS "value"
  ),
  -- lowercases the string
  lowercase AS (
    SELECT lower("value") AS "value"
    FROM unaccented
  ),
  -- remove single and double quotes
  removed_quotes AS (
    SELECT regexp_replace("value", '[''"]+', '', 'gi') AS "value"
    FROM lowercase
  ),
  -- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
  hyphenated AS (
    SELECT regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') AS "value"
    FROM removed_quotes
  ),
  -- truncate the trimmed value if needed to leave room for the random number   
  truncated AS (     
    SELECT substring("value", 1, GREATEST(1, "max_length" - 10)) AS "value"
    FROM hyphenated
  ),   
  -- trims hyphens('-') if they exist on the head or tail of the string
  trimmed AS (
    SELECT regexp_replace(regexp_replace("value", '\-+$', ''), '^\-', '') AS "value"
    FROM truncated
  ),
  -- add a random 8-digit number to help create a unique slug
  with_random AS (
    SELECT "value" || '-' || floor(random() * 100000000)::text AS "value"
    FROM trimmed
  )
  SELECT value FROM with_random;
$_$;

-- 2. Ownership
ALTER FUNCTION "public"."slugify" ("value" "text", "max_length" integer) OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."slugify" ("value" "text", "max_length" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."slugify" ("value" "text", "max_length" integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."slugify" ("value" "text", "max_length" integer) TO "service_role";

-----------------------------------
-- Trigger function to update the updated_at column on row updates
-----------------------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column" () RETURNS "trigger" LANGUAGE "plpgsql" SET search_path = public AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. Ownership
ALTER FUNCTION "public"."update_updated_at_column" () OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."update_updated_at_column" () TO "anon";

GRANT ALL ON FUNCTION "public"."update_updated_at_column" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."update_updated_at_column" () TO "service_role";
