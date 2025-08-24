-- Migration to simplify times of day schema

-- Create a custom type for times of day to ensure data integrity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_of_day') THEN
        CREATE TYPE time_of_day AS ENUM ('breakfast', 'brunch', 'lunch', 'dinner', 'dessert', 'snack', 'drinks');
    END IF;
END $$;

-- Step 1: Add times_of_day column to recipes table
ALTER TABLE recipes 
ADD COLUMN times_of_day time_of_day[];

-- Step 2: Migrate existing times of day
WITH time_of_day_mapping AS (
    SELECT 
        rtod.recipe_id, 
        ARRAY_AGG(tod.id::time_of_day) AS recipe_times
    FROM recipe_times_of_day rtod
    JOIN times_of_day tod ON rtod.timeofday_id = tod.id
    GROUP BY rtod.recipe_id
)
UPDATE recipes r
SET times_of_day = m.recipe_times
FROM time_of_day_mapping m
WHERE r.id = m.recipe_id;

-- Step 3: Drop related tables
DROP TABLE IF EXISTS recipe_times_of_day;
DROP TABLE IF EXISTS times_of_day;

-- Step 4: Enforce that the times_of_day column contains at least one value and is never null
ALTER TABLE recipes
ALTER COLUMN times_of_day SET NOT NULL;
ALTER TABLE recipes
ADD CONSTRAINT chk_times_of_day CHECK (array_length(times_of_day, 1) > 0);

-- Optional: Recreate any indexes or constraints
CREATE INDEX IF NOT EXISTS idx_recipes_times_of_day 
ON recipes USING GIN (times_of_day);