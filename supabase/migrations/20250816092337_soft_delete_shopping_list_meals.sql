-- Migration: Implement soft delete for shopping list items when a meal is deleted.
-- Previously, deleting a meal would also delete its associated shopping list items
-- using the ON DELETE CASCADE constraint.

-- 1. Drop ON DELETE CASCADE from meal_id foreign key in space_plan_shopping_lists
alter table space_plan_shopping_lists
drop constraint if exists space_plan_shopping_lists_meal_id_fkey;

alter table space_plan_shopping_lists
add constraint space_plan_shopping_lists_meal_id_fkey
foreign key (meal_id) references space_plan_meals(id);

-- 2. Create trigger function to soft delete shopping list items
create or replace function soft_delete_shopping_list_for_meal()
returns trigger as $$
begin
    update space_plan_shopping_lists
    set deleted_at = now()
    where meal_id = old.id and type = 'meal' and deleted_at is null;
    return old;
end;
$$ language plpgsql;

-- 3. Create trigger on space_plan_meals for soft delete
create trigger soft_delete_shopping_list_items
after delete on space_plan_meals
for each row execute procedure soft_delete_shopping_list_for_meal();