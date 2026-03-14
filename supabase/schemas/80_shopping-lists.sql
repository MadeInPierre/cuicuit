--
-- ==================================================
-- Triggers
-- ==================================================
--
-------------------
-- Soft delete shopping list items when a meal is deleted
-------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."soft_delete_shopping_list_for_meal" () RETURNS "trigger" LANGUAGE "plpgsql" AS $$
begin
    update space_plan_shopping_lists
    set deleted_at = now()
    where meal_id = old.id and type = 'meal' and deleted_at is null;
    return old;
end;
$$;

-- 2. Ownership
ALTER FUNCTION "public"."soft_delete_shopping_list_for_meal" () OWNER TO "postgres";

-- 3. Triggers
CREATE OR REPLACE TRIGGER "soft_delete_shopping_list_items"
AFTER DELETE ON "public"."space_plan_meals" FOR EACH ROW
EXECUTE FUNCTION "public"."soft_delete_shopping_list_for_meal" ();

-- 4. Grants
GRANT ALL ON FUNCTION "public"."soft_delete_shopping_list_for_meal" () TO "anon";

GRANT ALL ON FUNCTION "public"."soft_delete_shopping_list_for_meal" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."soft_delete_shopping_list_for_meal" () TO "service_role";

--
-- ==================================================
-- Functions
-- ==================================================
--
----------------
-- Get shopping recommendations based on most frequently checked off ingredients in the space
----------------
-- 1. Definition
CREATE OR REPLACE FUNCTION public.get_shopping_recommendations (space_id uuid)
RETURNS TABLE (

BEGIN
    RETURN QUERY
    SELECT DISTINCT i.*
    FROM (
        SELECT sl.ingredient_id
        FROM space_plan_shopping_lists sl
        WHERE 
            sl.space_id = get_shopping_recommendations.space_id -- Filter to the current space
            AND sl.checked_at IS NOT NULL -- Get the ingredients most frequently checked off
        GROUP BY sl.ingredient_id
        ORDER BY COUNT(sl.ingredient_id) DESC -- Order by frequency
    ) AS subquery
    JOIN ingredients i ON subquery.ingredient_id = i.id;
END;
$function$;

-- 2. Ownership
ALTER FUNCTION "public"."get_shopping_recommendations" (space_id uuid) OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (space_id uuid) TO "anon";

GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (space_id uuid) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (space_id uuid) TO "service_role";
