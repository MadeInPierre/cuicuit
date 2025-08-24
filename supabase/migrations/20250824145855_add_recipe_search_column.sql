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