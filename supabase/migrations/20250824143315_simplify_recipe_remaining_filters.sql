-- Migration to simplify recipes metadata schema

-- Create custom ENUM types for each category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course') THEN
        CREATE TYPE course AS ENUM ('appetizer', 'main', 'side', 'salad', 'soup', 'dessert', 'snack', 'drink');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cuisine') THEN
        CREATE TYPE cuisine AS ENUM (
            'italian',
            'mexican',
            'indian',
            'chinese',
            'french',
            'japanese',
            'mediterranean',
            'american',
            'spanish',
            'thai',
            'greek',
            'korean',
            'vietnamese',
            'middleeast',
            'british',
            'brazilian',
            'caribbean',
            'african'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipe_tool') THEN
        CREATE TYPE recipe_tool AS ENUM ('blender', 'fryer', 'juicer', 'kettle', 'microwave', 'mixer', 'oven', 'scale', 'stove', 'toaster');
    END IF;
END $$;

-- Step 1: Add array columns to recipes table
ALTER TABLE recipes 
ADD COLUMN courses course[] DEFAULT NULL,
ADD COLUMN cuisines cuisine[] DEFAULT NULL,
ADD COLUMN tools recipe_tool[] DEFAULT NULL;

-- Step 2: Migrate existing courses
WITH course_mapping AS (
    SELECT 
        rc.recipe_id, 
        ARRAY_AGG(c.id::course) AS recipe_courses
    FROM recipe_courses rc
    JOIN courses c ON rc.course_id = c.id
    GROUP BY rc.recipe_id
)
UPDATE recipes r
SET courses = m.recipe_courses
FROM course_mapping m
WHERE r.id = m.recipe_id;

-- Step 2: Migrate existing cuisines
WITH cuisine_mapping AS (
    SELECT 
        rc.recipe_id, 
        ARRAY_AGG(c.id::cuisine) AS recipe_cuisines
    FROM recipe_cuisines rc
    JOIN cuisines c ON rc.cuisine_id = c.id
    GROUP BY rc.recipe_id
)
UPDATE recipes r
SET cuisines = m.recipe_cuisines
FROM cuisine_mapping m
WHERE r.id = m.recipe_id;

-- Step 2: Migrate existing tools
WITH tool_mapping AS (
    SELECT 
        rt.recipe_id, 
        ARRAY_AGG(t.id::recipe_tool) AS recipe_tools
    FROM recipe_tools rt
    JOIN tools t ON rt.tool_id = t.id
    GROUP BY rt.recipe_id
)
UPDATE recipes r
SET tools = m.recipe_tools
FROM tool_mapping m
WHERE r.id = m.recipe_id;

-- Step 3: Drop related junction and lookup tables
DROP TABLE IF EXISTS recipe_courses;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS recipe_cuisines;
DROP TABLE IF EXISTS cuisines;
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS recipe_tools;
DROP TABLE IF EXISTS tools;

-- Step 4: Optional constraints to ensure at least one value if needed
ALTER TABLE recipes
ADD CONSTRAINT chk_courses CHECK (array_length(courses, 1) > 0 OR courses IS NULL),
ADD CONSTRAINT chk_cuisines CHECK (array_length(cuisines, 1) > 0 OR cuisines IS NULL),
ADD CONSTRAINT chk_tools CHECK (array_length(tools, 1) > 0 OR tools IS NULL);

-- Step 4.1: Make the columns NOT NULL
ALTER TABLE recipes
ALTER COLUMN courses SET NOT NULL,
ALTER COLUMN cuisines SET NOT NULL,
ALTER COLUMN tools SET NOT NULL;

-- Step 5: Create GIN indexes for efficient array querying
CREATE INDEX idx_recipes_courses ON recipes USING GIN (courses);
CREATE INDEX idx_recipes_cuisines ON recipes USING GIN (cuisines);
CREATE INDEX idx_recipes_tools ON recipes USING GIN (tools);