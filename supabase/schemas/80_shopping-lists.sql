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
