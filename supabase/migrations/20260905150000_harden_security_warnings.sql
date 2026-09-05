-- ====================================================================
-- Harden linter security warnings (no app behavior change)
--
-- 1. Pin search_path on all SECURITY DEFINER / trigger / util functions so
--    they can never resolve objects from a mutable search_path.
-- 2. Revoke PUBLIC/anon EXECUTE from server-only SECURITY DEFINER functions
--    and re-grant to authenticated/service_role where clients still need them.
-- 3. Remove public-listing SELECT policies on storage.objects (buckets are
--    public and served via direct URLs; the app never lists).
-- ====================================================================

-- --------------------------------------------------------------------
-- 10_utils.sql
-- --------------------------------------------------------------------
ALTER FUNCTION public.slugify(value text, max_length integer) SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- --------------------------------------------------------------------
-- 20_users.sql
-- Trigger-only function: fired via trigger without runtime EXECUTE checks.
-- --------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- --------------------------------------------------------------------
-- 40_ingredients.sql
-- --------------------------------------------------------------------
ALTER FUNCTION public.update_ingredient_fts() SET search_path = public;
ALTER FUNCTION public.match_ingredient(query_text text, lang_code text, n_matches integer, is_raw_import boolean) SET search_path = public, extensions;

-- --------------------------------------------------------------------
-- 50_recipes.sql
-- --------------------------------------------------------------------
ALTER FUNCTION public.generate_recipe_search_term() SET search_path = public, extensions;
ALTER FUNCTION public.set_unique_slug_from_name() SET search_path = public;

-- --------------------------------------------------------------------
-- 80_shopping-lists.sql
-- --------------------------------------------------------------------
ALTER FUNCTION public.soft_delete_shopping_list_for_meal() SET search_path = public;
ALTER FUNCTION public.get_shopping_recommendations(space_id uuid, lang text, "limit" integer, per_aisle_limit integer, aisle_filter public.supermarket_aisle, seed double precision) SET search_path = public;

-- --------------------------------------------------------------------
-- 01_billing.sql — search_path on billing/credit functions
-- --------------------------------------------------------------------
ALTER FUNCTION billing.on_credit_log_insert_update_balances() SET search_path = public, billing;

-- The Stripe-ingestion trigger function is only created when the stripe schema
-- (Stripe Sync Engine) is present, so guard its ALTER accordingly.
DO $$ BEGIN
    IF to_regprocedure('billing.on_stripe_charge_insert_append_credit_log()') IS NOT NULL THEN
        ALTER FUNCTION billing.on_stripe_charge_insert_append_credit_log() SET search_path = public, billing, stripe, auth;
    END IF;
END $$;

ALTER FUNCTION billing.process_expired_credits() SET search_path = public, billing;
ALTER FUNCTION public.consume_credits(p_user_id uuid, p_amount_to_consume integer, p_source text, p_metadata jsonb) SET search_path = public, billing;
ALTER FUNCTION public.get_public_pool_health() SET search_path = public;

-- --------------------------------------------------------------------
-- 01_billing.sql — revoke client EXECUTE from server-only SECURITY DEFINER
-- functions. consume_credits is called exclusively via the service_role
-- (supabaseAdmin) client.
-- --------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.consume_credits(uuid, integer, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text, jsonb) TO service_role;

-- Billing trigger/cron functions are never meant to be called by clients.
REVOKE ALL ON FUNCTION billing.on_credit_log_insert_update_balances() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION billing.process_expired_credits() FROM public, anon, authenticated;

-- --------------------------------------------------------------------
-- 01_billing.sql — get_public_pool_health stays SECURITY DEFINER (its body
-- reads the user_id = null public pool row that RLS forbids), but must only
-- be callable by authenticated clients, never PUBLIC/anon.
-- --------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_public_pool_health() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_pool_health() TO authenticated;

-- --------------------------------------------------------------------
-- 99_RLS.sql — SECURITY DEFINER RLS helpers must stay EXECUTE for
-- authenticated (they're evaluated inside RLS policies), but not PUBLIC/anon.
-- --------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_space_member(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_space_member(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.users_share_common_space(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.users_share_common_space(uuid, uuid) TO authenticated;

-- --------------------------------------------------------------------
-- 99_RLS.sql — drop public-listing SELECT policies on storage.objects.
-- Buckets are public and images load via direct public URLs; the app never
-- lists objects, so these policies only enabled unwanted client-side listing.
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Ingredients are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Recipe images are viewable by all logged-in users" ON storage.objects;
