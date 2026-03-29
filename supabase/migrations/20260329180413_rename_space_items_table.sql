drop trigger if exists "update_space_plan_shopping_lists_updated_at" on "public"."space_plan_shopping_lists";

revoke delete on table "public"."space_plan_shopping_lists" from "anon";

revoke insert on table "public"."space_plan_shopping_lists" from "anon";

revoke references on table "public"."space_plan_shopping_lists" from "anon";

revoke select on table "public"."space_plan_shopping_lists" from "anon";

revoke trigger on table "public"."space_plan_shopping_lists" from "anon";

revoke truncate on table "public"."space_plan_shopping_lists" from "anon";

revoke update on table "public"."space_plan_shopping_lists" from "anon";

revoke delete on table "public"."space_plan_shopping_lists" from "authenticated";

revoke insert on table "public"."space_plan_shopping_lists" from "authenticated";

revoke references on table "public"."space_plan_shopping_lists" from "authenticated";

revoke select on table "public"."space_plan_shopping_lists" from "authenticated";

revoke trigger on table "public"."space_plan_shopping_lists" from "authenticated";

revoke truncate on table "public"."space_plan_shopping_lists" from "authenticated";

revoke update on table "public"."space_plan_shopping_lists" from "authenticated";

revoke delete on table "public"."space_plan_shopping_lists" from "service_role";

revoke insert on table "public"."space_plan_shopping_lists" from "service_role";

revoke references on table "public"."space_plan_shopping_lists" from "service_role";

revoke select on table "public"."space_plan_shopping_lists" from "service_role";

revoke trigger on table "public"."space_plan_shopping_lists" from "service_role";

revoke truncate on table "public"."space_plan_shopping_lists" from "service_role";

revoke update on table "public"."space_plan_shopping_lists" from "service_role";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_check";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_created_by_fkey";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_ingredient_id_fkey";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_meal_id_fkey";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_meal_origin_check";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_space_id_fkey";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_type_check";

alter table "public"."space_plan_shopping_lists" drop constraint "space_plan_shopping_lists_pkey";

drop index if exists "public"."space_plan_shopping_lists_pkey";

drop table "public"."space_plan_shopping_lists";


  create table "public"."space_items" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "created_by" uuid not null,
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone,
    "space_id" uuid not null,
    "type" text not null,
    "meal_id" uuid,
    "meal_origin" text,
    "ingredient_id" uuid,
    "quantity" numeric,
    "unit" text,
    "name" text,
    "checked_at" timestamp with time zone
      );


CREATE UNIQUE INDEX space_items_pkey ON public.space_items USING btree (id);

alter table "public"."space_items" add constraint "space_items_pkey" PRIMARY KEY using index "space_items_pkey";

alter table "public"."space_items" add constraint "space_items_check" CHECK ((((type = 'meal'::text) AND (meal_id IS NOT NULL) AND (meal_origin IS NOT NULL) AND (ingredient_id IS NOT NULL)) OR ((type = 'independent'::text) AND (meal_id IS NULL) AND ((ingredient_id IS NOT NULL) OR (name IS NOT NULL))))) not valid;

alter table "public"."space_items" validate constraint "space_items_check";

alter table "public"."space_items" add constraint "space_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."space_items" validate constraint "space_items_created_by_fkey";

alter table "public"."space_items" add constraint "space_items_ingredient_id_fkey" FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE not valid;

alter table "public"."space_items" validate constraint "space_items_ingredient_id_fkey";

alter table "public"."space_items" add constraint "space_items_meal_id_fkey" FOREIGN KEY (meal_id) REFERENCES public.space_plan_meals(id) not valid;

alter table "public"."space_items" validate constraint "space_items_meal_id_fkey";

alter table "public"."space_items" add constraint "space_items_meal_origin_check" CHECK ((meal_origin = ANY (ARRAY['recipe'::text, 'ignored'::text, 'added'::text]))) not valid;

alter table "public"."space_items" validate constraint "space_items_meal_origin_check";

alter table "public"."space_items" add constraint "space_items_space_id_fkey" FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE not valid;

alter table "public"."space_items" validate constraint "space_items_space_id_fkey";

alter table "public"."space_items" add constraint "space_items_type_check" CHECK ((type = ANY (ARRAY['meal'::text, 'independent'::text]))) not valid;

alter table "public"."space_items" validate constraint "space_items_type_check";

grant delete on table "public"."space_items" to "anon";

grant insert on table "public"."space_items" to "anon";

grant references on table "public"."space_items" to "anon";

grant select on table "public"."space_items" to "anon";

grant trigger on table "public"."space_items" to "anon";

grant truncate on table "public"."space_items" to "anon";

grant update on table "public"."space_items" to "anon";

grant delete on table "public"."space_items" to "authenticated";

grant insert on table "public"."space_items" to "authenticated";

grant references on table "public"."space_items" to "authenticated";

grant select on table "public"."space_items" to "authenticated";

grant trigger on table "public"."space_items" to "authenticated";

grant truncate on table "public"."space_items" to "authenticated";

grant update on table "public"."space_items" to "authenticated";

grant delete on table "public"."space_items" to "service_role";

grant insert on table "public"."space_items" to "service_role";

grant references on table "public"."space_items" to "service_role";

grant select on table "public"."space_items" to "service_role";

grant trigger on table "public"."space_items" to "service_role";

grant truncate on table "public"."space_items" to "service_role";

grant update on table "public"."space_items" to "service_role";

CREATE TRIGGER update_space_items_updated_at BEFORE UPDATE ON public.space_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


