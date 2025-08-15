-- This migration adds a new table for shopping lists associated with meal plans in a space.
-- When a user adds a meal to the plan, the meal's recipe ingredients are automatically added to the shopping list.
-- The user can then customize the shopping list by adding or removing ingredients as needed. 
-- They can also add independent items to the shopping list.


create table space_plan_shopping_lists (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null,

    space_id uuid not null references spaces(id) on delete cascade,

    type text not null check (type in ('meal', 'independent')),
    
    -- If type is 'meal'
    meal_id uuid references space_plan_meals(id) on delete cascade,
    meal_origin text default null check (meal_origin in ('recipe', 'ignored', 'added')),

    -- Common fields for both types 
    ingredient_id uuid references ingredients(id) on delete cascade,
    quantity numeric not null default 1,
    unit text,

    -- For independent items, we can have a name field and no ingredient_id 
    name text, -- for custom independent items

    check (
        (type = 'meal' and 
            meal_id is not null 
            and meal_origin is not null
            and ingredient_id is not null 
        ) or (type = 'independent' 
            and meal_id is null 
            and (ingredient_id is not null or name is not null)
        )
    )
);

-- Add trigger to update updated_at on any update
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_space_plan_shopping_lists_updated_at
before update on space_plan_shopping_lists
for each row execute procedure update_updated_at();
