--
-- ==================================================
-- Triggers
-- ==================================================
--
-------------------
-- Soft delete shopping list items when a meal is deleted
-------------------
-- 1. Definition
CREATE OR REPLACE FUNCTION "public"."soft_delete_shopping_list_for_meal" () RETURNS "trigger" LANGUAGE "plpgsql" SET search_path = public AS $$
begin
    update space_items
    set deleted_at = now()
    where meal_id = old.id and type = 'meal' and deleted_at is null;
    return old;
end;
$$;

-- 2. Ownership
ALTER FUNCTION "public"."soft_delete_shopping_list_for_meal" () OWNER TO "postgres";

-- 3. Triggers
CREATE OR REPLACE TRIGGER "soft_delete_shopping_list_items"
AFTER DELETE ON "public"."space_meals" FOR EACH ROW
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
/*
Function: public.get_shopping_recommendations
Returns weighted, deterministic shopping ingredient recommendations for a space,
optionally filtered by aisle, with both global and per-aisle caps.

How it works:
1) scored CTE
- Counts checked occurrences per ingredient in space_items.
- Applies optional aisle filtering.
- Joins ingredient metadata and language translation.
- Uses translation fallback: name_plural -> name_singular -> name_general.

2) sampled CTE
- Computes weighted random ranks using Efraimidis-Spirakis style key:
-ln(U) / weight
where:
U is deterministic pseudo-random value from md5(seed, ingredient_id, scope),
weight is ingredient score (frequency).
- Produces:
a) aisle_sample_rank (partitioned by aisle)
b) global_sample_rank (across all rows)

3) Final selection
- If aisle_filter is NULL: enforce per_aisle_limit via aisle_sample_rank.
- Always enforce global "limit" via global_sample_rank.
- Order by global_sample_rank ascending.

Notes:
- Deterministic output for same inputs (including seed).
- Higher-frequency ingredients are more likely to rank earlier.
*/
CREATE OR REPLACE FUNCTION public.get_shopping_recommendations (
    space_id uuid,
    lang text,
    "limit" integer DEFAULT 200,
    per_aisle_limit integer DEFAULT 20,
    aisle_filter public.supermarket_aisle DEFAULT NULL,
    seed double precision DEFAULT 0.5
) RETURNS TABLE (
    ingredient_id uuid,
    aisle public.supermarket_aisle,
    slug text,
    slug_general text,
    name text,
    score bigint
) LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
    RETURN QUERY
    WITH scored AS (
        SELECT
            i.id AS ingredient_id,
            i.aisle,
            i.slug::text AS slug,
            i.slug_general::text AS slug_general,
            COALESCE(it.name_plural, it.name_singular, it.name_general)::text AS name,
            subquery.freq::bigint AS score
        FROM (
            SELECT sl.ingredient_id, COUNT(*) AS freq
            FROM space_items sl
            JOIN ingredients i2
              ON i2.id = sl.ingredient_id
            WHERE
                sl.space_id = get_shopping_recommendations.space_id
                AND sl.checked_at IS NOT NULL
                AND (
                    get_shopping_recommendations.aisle_filter IS NULL
                    OR i2.aisle = get_shopping_recommendations.aisle_filter
                )
            GROUP BY sl.ingredient_id
            ORDER BY freq DESC
        ) AS subquery
        JOIN ingredients i
            ON subquery.ingredient_id = i.id
        LEFT JOIN languages l
            ON l.lang = get_shopping_recommendations.lang
        LEFT JOIN ingredient_translations it
            ON it.ingredient_id = i.id
           AND it.language_id = l.id
    ), sampled AS (
        SELECT
            scored.ingredient_id,
            scored.aisle,
            scored.slug,
            scored.slug_general,
            scored.name,
            scored.score,
            ROW_NUMBER() OVER (
                PARTITION BY scored.aisle
                ORDER BY -LN(
                    GREATEST(
                        (
                            ('x' || substr(md5(
                                get_shopping_recommendations.seed::text
                                || ':'
                                || scored.ingredient_id::text
                                || ':aisle'
                            ), 1, 16))::bit(64)::bigint::double precision
                            / 9223372036854775807.0
                        ),
                        1e-12::double precision
                    )
                ) / GREATEST(scored.score::double precision, 1e-12::double precision)
            ) AS aisle_sample_rank,
            ROW_NUMBER() OVER (
                ORDER BY -LN(
                    GREATEST(
                        (
                            ('x' || substr(md5(
                                get_shopping_recommendations.seed::text
                                || ':'
                                || scored.ingredient_id::text
                                || ':global'
                            ), 1, 16))::bit(64)::bigint::double precision
                            / 9223372036854775807.0
                        ),
                        1e-12::double precision
                    )
                ) / GREATEST(scored.score::double precision, 1e-12::double precision)
            ) AS global_sample_rank
        FROM scored
    )
    SELECT
        sampled.ingredient_id,
        sampled.aisle,
        sampled.slug,
        sampled.slug_general,
        sampled.name,
        sampled.score
    FROM sampled
    WHERE
        (
            get_shopping_recommendations.aisle_filter IS NOT NULL
            OR sampled.aisle_sample_rank <= get_shopping_recommendations.per_aisle_limit
        )
        AND sampled.global_sample_rank <= get_shopping_recommendations."limit"
    ORDER BY sampled.global_sample_rank ASC;
END;
$function$;

-- 2. Ownership
ALTER FUNCTION "public"."get_shopping_recommendations" (
    space_id uuid,
    lang text,
    "limit" integer,
    per_aisle_limit integer,
    aisle_filter public.supermarket_aisle,
    seed double precision
) OWNER TO "postgres";

-- 3. Constraints
-- 4. Triggers
-- 5. Grants
GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (
    space_id uuid,
    lang text,
    "limit" integer,
    per_aisle_limit integer,
    aisle_filter public.supermarket_aisle,
    seed double precision
) TO "anon";

GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (
    space_id uuid,
    lang text,
    "limit" integer,
    per_aisle_limit integer,
    aisle_filter public.supermarket_aisle,
    seed double precision
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_shopping_recommendations" (
    space_id uuid,
    lang text,
    "limit" integer,
    per_aisle_limit integer,
    aisle_filter public.supermarket_aisle,
    seed double precision
) TO "service_role";
