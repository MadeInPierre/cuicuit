create
or replace view "public"."recipes_randomized" as
SELECT
    id,
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
FROM
    public.recipes
ORDER BY
    random ();