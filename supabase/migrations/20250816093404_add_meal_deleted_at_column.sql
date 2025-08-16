-- Add deleted_at column to space_plan_meals for soft deletes
alter table space_plan_meals
add column deleted_at timestamp with time zone default null;