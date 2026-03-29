set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_shopping_recommendations(space_id uuid, lang text, "limit" integer DEFAULT 200, per_aisle_limit integer DEFAULT 20, aisle_filter public.supermarket_aisle DEFAULT NULL::public.supermarket_aisle, seed double precision DEFAULT 0.5)
 RETURNS TABLE(ingredient_id uuid, aisle public.supermarket_aisle, slug text, slug_general text, name text, score bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.soft_delete_shopping_list_for_meal()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    update space_items
    set deleted_at = now()
    where meal_id = old.id and type = 'meal' and deleted_at is null;
    return old;
end;
$function$
;


