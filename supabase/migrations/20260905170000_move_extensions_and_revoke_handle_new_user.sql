-- ====================================================================
-- Finish hardening linter security warnings
--
-- 1. handle_new_user was only revoked FROM PUBLIC, so anon/authenticated
--    could still execute it via /rest/v1/rpc. Revoke from all three.
--    (It still fires correctly as a trigger on auth.users insert.)
--
-- 2. Move pg_trgm, unaccent and vector out of the public schema into the
--    extensions schema (resolves extension_in_public). The functions that
--    use them already have `search_path = public, extensions`, so unqualified
--    unaccent()/similarity() stays resolvable. Existing dependent objects
--    (the GIN index on ingredient_translations using gin_trgm_ops, and the
--    ingredients.embedding column of type vector) are tracked by OID and
--    keep working; moving the type/opclass out of postgrest-exposed public
--    also removes these extension functions from the client API.
-- ====================================================================

-- 1. handle_new_user: revoke from anon/authenticated too.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Move extensions to the extensions schema.
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
