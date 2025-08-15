-- This migration creates the appropriate tables for a basic meal plans feature.

-- CONTEXT:
-- Currently, the project has a `spaces` table which contains user homes. 
-- Each space has one shared meal plan across all users in that space.
-- Users can add meals to the meal plan (i.e. recipes, servings, and ingredients which can be the same as the recipe or customized).
-- The project also has a `recipes` table which contains the recipes that can be added to the meal plan.
-- Recipe ingredients are stored in a separate `recipe_ingredients` table (one recipe can have many ingredients).

-- IMPLEMENTATION:
-- Create a `space_plan_meals` table which contains the added meals for each space.
-- Each meal is linked to a space and a recipe, and adds:
    -- a timestamp for creation/update
    -- a servings number
    -- a position for ordering meals in the plan
    -- a list of ingredients (which can be the same as the recipe or customized)
-- Create a `space_plan_meal_ingredients` table to store the ingredients for each meal.
-- Additionally, users can add independent items to the meal plan, such as household items or extra ingredients.
    -- Create a `space_plan_items` table for these items, which contains:
        -- a timestamp for creation/update
        -- a name for the item/ingredient
        -- optional id reference to an ingredient in the `ingredients` table
        -- a quantity and unit for the item



create table space_plan_meals (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    space_id uuid not null references spaces(id) on delete cascade,
    recipe_id uuid not null references recipes(id) on delete cascade,
    servings integer not null default 1,
    position integer not null default 0
);

-- create table space_plan_meal_ingredients (
--     id uuid primary key default gen_random_uuid(),
--     created_at timestamp with time zone default now(),
--     updated_at timestamp with time zone default now(),

--     meal_id uuid not null references space_plan_meals(id) on delete cascade,
--     ingredient_id uuid not null references ingredients(id) on delete cascade,
--     quantity numeric not null default 1,
--     unit text
-- );

-- create table space_plan_items (
--     id uuid primary key default gen_random_uuid(),
--     created_at timestamp with time zone default now(),
--     updated_at timestamp with time zone default now(),

--     space_id uuid not null references spaces(id) on delete cascade,
--     name text not null,
--     ingredient_id uuid references ingredients(id) on delete set null,
--     quantity numeric not null default 1,
--     unit text
-- );

-- Add trigger to update updated_at on any update
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_space_plan_meals_updated_at
before update on space_plan_meals
for each row execute procedure update_updated_at();

-- create trigger update_space_plan_meal_ingredients_updated_at
-- before update on space_plan_meal_ingredients
-- for each row execute procedure update_updated_at();

-- create trigger update_space_plan_items_updated_at
-- before update on space_plan_items
-- for each row execute procedure update_updated_at();
