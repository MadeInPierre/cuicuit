-- Create a migration to add search_term column to recipes table
-- and create a trigger to automatically populate it

-- Add the search_term column
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS search_term text;

-- Function to generate search term
CREATE OR REPLACE FUNCTION generate_recipe_search_term()
RETURNS trigger AS $$
BEGIN
    -- Combine title and description, convert to lowercase, remove accents
    NEW.search_term = LOWER(
        UNACCENT(
            COALESCE(NEW.title, '') || ' ' || 
            COALESCE(NEW.description, '')
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate search term on INSERT
CREATE OR REPLACE TRIGGER recipe_search_term_insert_trigger
BEFORE INSERT ON recipes
FOR EACH ROW
EXECUTE FUNCTION generate_recipe_search_term();

-- Create trigger to update search term on UPDATE
CREATE OR REPLACE TRIGGER recipe_search_term_update_trigger
BEFORE UPDATE ON recipes
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.description IS DISTINCT FROM NEW.description)
EXECUTE FUNCTION generate_recipe_search_term();

-- Update existing records
UPDATE recipes 
SET search_term = LOWER(
    UNACCENT(
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '')
    )
);

-- We don't need this table, better just hardcode the values in the client
drop materialized view supermarket_aisles;

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