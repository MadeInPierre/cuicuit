alter table "public"."space_items" drop constraint "space_items_check";

drop view if exists "public"."recipes_randomized";

alter table "public"."space_items" add constraint "space_items_check" CHECK ((((type = 'meal'::text) AND (meal_id IS NOT NULL) AND (meal_origin IS NOT NULL) AND ((ingredient_id IS NOT NULL) OR (name IS NOT NULL))) OR ((type = 'independent'::text) AND (meal_id IS NULL) AND ((ingredient_id IS NOT NULL) OR (name IS NOT NULL))))) not valid;

alter table "public"."space_items" validate constraint "space_items_check";

create or replace view "public"."recipes_randomized" with (security_invoker=on) as  SELECT id,
    created_at,
    updated_at,
    deleted_at,
    title,
    short_title,
    description,
    notes,
    image_ids,
    slug,
    author_id,
    language_id,
    source_type,
    source_url,
    time_prep_minutes,
    time_cook_minutes,
    time_rest_minutes,
    time_total_minutes,
    effort_level,
    skill_level,
    cleanup_level,
    cost_level,
    servings,
    steps,
    times_of_day,
    courses,
    cuisines,
    tools,
    search_term
   FROM public.recipes
  ORDER BY (random());



