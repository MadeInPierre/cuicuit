set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_shopping_recommendations(space_id uuid)
 RETURNS SETOF public.ingredients
 LANGUAGE plpgsql
AS $function$
DECLARE

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
$function$
;


