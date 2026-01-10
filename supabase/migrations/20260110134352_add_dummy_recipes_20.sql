WITH seq AS (
  SELECT generate_series(1, 20) AS n
),
new_recipes AS (
  INSERT INTO public.recipes (
    id, author_id, title, description, servings, times_of_day, courses, cuisines,
    tools, slug, language_id, source_type, effort_level, skill_level,
    cleanup_level, cost_level, steps, time_prep_minutes, time_cook_minutes
  )
  SELECT
    gen_random_uuid(),
    'cc5f4f5b-02d5-467e-8f05-103c98b200b1'::uuid,
    'Example Pancakes ' || lpad(n::text, 2, '0'),
    'Light, quick pancakes for breakfast or brunch.',
    4,
    ARRAY['breakfast']::time_of_day[],
    ARRAY['dessert','snack']::course[],
    ARRAY['american']::cuisine[],
    ARRAY['stove','blender']::recipe_tool[],
    'example-pancakes-' || lpad(n::text, 2, '0'),
    1,
    'user-manual',
    'low',
    'beginner',
    'low',
    'budget',
    ARRAY[
      'In a bowl mix flour, milk, and egg.',
      'Heat a pan with a little oil and pour batter.',
      'Cook until bubbles form, flip and cook until golden.',
      'Serve warm.'
    ]::text[],
    10,
    10
  FROM seq
  RETURNING id
)
INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, notes, details, raw_input)
SELECT id, '0208b403-8533-4ab6-a48f-b0e6f15d4b3d'::uuid, 1, 'unit', 'beat lightly', 'large egg', '1 large egg' FROM new_recipes
UNION ALL
SELECT id, '0299d48d-b863-4224-adc5-bc29f54abe7f'::uuid, 200, 'g', 'sift for fluffiness', 'plain flour', '200 g plain flour' FROM new_recipes;