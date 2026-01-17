-- Add is_optional column to recipe_ingredients table
ALTER TABLE recipe_ingredients
ADD COLUMN is_optional BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows (though DEFAULT will handle this)
UPDATE recipe_ingredients
SET is_optional = false
WHERE is_optional IS NULL;

-- Add preparation column to recipe_ingredients table
ALTER TABLE recipe_ingredients
ADD COLUMN preparation TEXT;