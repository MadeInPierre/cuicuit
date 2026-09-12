drop view if exists "public"."recipes_randomized";

alter table "public"."recipe_ingredients" drop constraint "recipe_ingredients_pkey";

drop index if exists "public"."recipe_ingredients_pkey";

alter table "public"."recipe_ingredients" add column "custom_name" text;

alter table "public"."recipe_ingredients" add column "id" uuid not null default gen_random_uuid();

alter table "public"."recipe_ingredients" alter column "ingredient_id" drop not null;

CREATE UNIQUE INDEX recipe_ingredients_recipe_custom_uniq ON public.recipe_ingredients USING btree (recipe_id, lower(custom_name)) WHERE (ingredient_id IS NULL);

CREATE UNIQUE INDEX recipe_ingredients_recipe_ingredient_uniq ON public.recipe_ingredients USING btree (recipe_id, ingredient_id) WHERE (ingredient_id IS NOT NULL);

CREATE UNIQUE INDEX recipe_ingredients_pkey ON public.recipe_ingredients USING btree (id);

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_pkey" PRIMARY KEY using index "recipe_ingredients_pkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_custom_check" CHECK (((ingredient_id IS NOT NULL) OR ((custom_name IS NOT NULL) AND (custom_name <> ''::text)))) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_custom_check";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_custom_name_check" CHECK (((custom_name IS NULL) OR (length(custom_name) <= 100))) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_custom_name_check";

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



