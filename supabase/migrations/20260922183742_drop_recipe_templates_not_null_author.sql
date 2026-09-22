-- Drop legacy import-template recipes and require an owner on every recipe.
--
-- URL imports used to stage each cached recipe as an author-less template row
-- and duplicate it per user. Imports now build the user's rows directly from
-- the cached LLM output, so templates are dead weight (invisible in the app,
-- and a poisoning vector for ingredient matching).
--
-- Safety: every delete below is scoped to author-less rows only, so user
-- recipes (author_id NOT NULL) are untouched by construction. A guard aborts
-- the migration if the staged set ever contains anything else.

-- 1. Stage the legacy templates.
CREATE TEMP TABLE legacy_templates ON COMMIT DROP AS
SELECT id FROM public.recipes WHERE author_id IS NULL;

-- 2. Guard: abort unless every staged row is author-less.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.recipes r
    JOIN legacy_templates t ON t.id = r.id
    WHERE r.author_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Guard tripped: staged set contains user-owned recipes, aborting.';
  END IF;
END $$;

-- 3. Remove plan items of meals pointing at staged templates, if any
-- (meals normally reference user copies; expected: 0 rows). Required first:
-- space_items.meal_id is RESTRICT.
DELETE FROM public.space_items si
USING public.space_meals sm
WHERE si.meal_id = sm.id
  AND sm.recipe_id IN (SELECT id FROM legacy_templates);

-- 4. Delete the staged templates (cascades to their own recipe_ingredients
-- and, if any existed, their meals).
DELETE FROM public.recipes r
USING legacy_templates t
WHERE r.id = t.id;

-- 5. Every recipe now has an owner: enforce it.
ALTER TABLE "public"."recipes" ALTER COLUMN "author_id" SET NOT NULL;
