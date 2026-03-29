drop trigger if exists "soft_delete_shopping_list_items" on "public"."space_plan_meals";

drop trigger if exists "update_space_plan_meals_updated_at" on "public"."space_plan_meals";

revoke delete on table "public"."space_plan_meals" from "anon";

revoke insert on table "public"."space_plan_meals" from "anon";

revoke references on table "public"."space_plan_meals" from "anon";

revoke select on table "public"."space_plan_meals" from "anon";

revoke trigger on table "public"."space_plan_meals" from "anon";

revoke truncate on table "public"."space_plan_meals" from "anon";

revoke update on table "public"."space_plan_meals" from "anon";

revoke delete on table "public"."space_plan_meals" from "authenticated";

revoke insert on table "public"."space_plan_meals" from "authenticated";

revoke references on table "public"."space_plan_meals" from "authenticated";

revoke select on table "public"."space_plan_meals" from "authenticated";

revoke trigger on table "public"."space_plan_meals" from "authenticated";

revoke truncate on table "public"."space_plan_meals" from "authenticated";

revoke update on table "public"."space_plan_meals" from "authenticated";

revoke delete on table "public"."space_plan_meals" from "service_role";

revoke insert on table "public"."space_plan_meals" from "service_role";

revoke references on table "public"."space_plan_meals" from "service_role";

revoke select on table "public"."space_plan_meals" from "service_role";

revoke trigger on table "public"."space_plan_meals" from "service_role";

revoke truncate on table "public"."space_plan_meals" from "service_role";

revoke update on table "public"."space_plan_meals" from "service_role";

alter table "public"."space_plan_meals" drop constraint "space_plan_meals_created_by_fkey";

alter table "public"."space_plan_meals" drop constraint "space_plan_meals_recipe_id_fkey";

alter table "public"."space_plan_meals" drop constraint "space_plan_meals_space_id_fkey";

alter table "public"."space_items" drop constraint "space_items_meal_id_fkey";

alter table "public"."space_plan_meals" drop constraint "space_plan_meals_pkey";

drop index if exists "public"."space_plan_meals_pkey";

drop table "public"."space_plan_meals";


  create table "public"."space_meals" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "created_by" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "space_id" uuid not null,
    "recipe_id" uuid not null,
    "servings" integer not null default 1,
    "position" integer not null default 0,
    "deleted_at" timestamp with time zone
      );


CREATE UNIQUE INDEX space_meals_pkey ON public.space_meals USING btree (id);

alter table "public"."space_meals" add constraint "space_meals_pkey" PRIMARY KEY using index "space_meals_pkey";

alter table "public"."space_meals" add constraint "space_meals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."space_meals" validate constraint "space_meals_created_by_fkey";

alter table "public"."space_meals" add constraint "space_meals_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."space_meals" validate constraint "space_meals_recipe_id_fkey";

alter table "public"."space_meals" add constraint "space_meals_space_id_fkey" FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE not valid;

alter table "public"."space_meals" validate constraint "space_meals_space_id_fkey";

alter table "public"."space_items" add constraint "space_items_meal_id_fkey" FOREIGN KEY (meal_id) REFERENCES public.space_meals(id) not valid;

alter table "public"."space_items" validate constraint "space_items_meal_id_fkey";

grant delete on table "public"."space_meals" to "anon";

grant insert on table "public"."space_meals" to "anon";

grant references on table "public"."space_meals" to "anon";

grant select on table "public"."space_meals" to "anon";

grant trigger on table "public"."space_meals" to "anon";

grant truncate on table "public"."space_meals" to "anon";

grant update on table "public"."space_meals" to "anon";

grant delete on table "public"."space_meals" to "authenticated";

grant insert on table "public"."space_meals" to "authenticated";

grant references on table "public"."space_meals" to "authenticated";

grant select on table "public"."space_meals" to "authenticated";

grant trigger on table "public"."space_meals" to "authenticated";

grant truncate on table "public"."space_meals" to "authenticated";

grant update on table "public"."space_meals" to "authenticated";

grant delete on table "public"."space_meals" to "service_role";

grant insert on table "public"."space_meals" to "service_role";

grant references on table "public"."space_meals" to "service_role";

grant select on table "public"."space_meals" to "service_role";

grant trigger on table "public"."space_meals" to "service_role";

grant truncate on table "public"."space_meals" to "service_role";

grant update on table "public"."space_meals" to "service_role";

CREATE TRIGGER soft_delete_shopping_list_items AFTER DELETE ON public.space_meals FOR EACH ROW EXECUTE FUNCTION public.soft_delete_shopping_list_for_meal();

CREATE TRIGGER update_space_meals_updated_at BEFORE UPDATE ON public.space_meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


