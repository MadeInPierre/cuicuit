drop trigger if exists "update_space_plan_meals_updated_at" on "public"."space_plan_meals";

drop trigger if exists "update_space_plan_shopping_lists_updated_at" on "public"."space_plan_shopping_lists";

drop function if exists "public"."update_updated_at" ();

CREATE TRIGGER update_space_plan_meals_updated_at BEFORE
UPDATE ON public.space_plan_meals FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column ();

CREATE TRIGGER update_space_plan_shopping_lists_updated_at BEFORE
UPDATE ON public.space_plan_shopping_lists FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column ();
