import os
import json
from supabase import create_client, Client
from typing import Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Supabase Configuration ---
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("PUBLIC_SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set in the .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Path to your ingredients JSON files ---
INGREDIENTS_FOLDER = "data/ingredients/docs"

# --- Mappings for ENUM types ---
COMMON_LEVEL_MAP = {
    "daily": "daily",
    "common": "common",
    "occasionally": "occasionally",
    "rare": "rare",
    "never": "never",
    # Add mappings for any values not directly in the enum
    "uncommon": "occasionally",  # Mapping 'uncommon' to 'occasionally'
    # "default": "common",  # Mapping 'default' frequency to 'common'
}

SUBSTITUTION_STRENGTH_MAP = {
    "equivalent": "equivalent",
    "similar": "close",  # Mapping 'similar' to 'close'
    "far": "far",
    "variants": "variant",
}

# --- Global map to store ingredient slugs to their newly inserted UUIDs ---
ingredient_slug_to_id: Dict[str, str] = {}
language_code_to_id: Dict[str, str] = {}


def fetch_language_ids():
    """
    Fetches language IDs from the 'languages' table and populates the global map.
    """
    print("Fetching language IDs...")
    try:
        response = supabase.table("languages").select("id, lang").execute()
        if response.data:
            for lang_row in response.data:
                language_code_to_id[lang_row["lang"]] = lang_row["id"]
            print(f"Fetched {len(language_code_to_id)} language IDs.")
        else:
            print("No languages found in the 'languages' table. Please ensure it's populated.")
            print(response.error)
            exit()
    except Exception as e:
        print(f"Error fetching language IDs: {e}")
        exit()


def get_base_unit(quantity_units: dict) -> str:
    """
    Determines the base unit based on the 'default' value in quantity_units.
    Maps "whole" to "unit".
    """
    freq_substitutions = {
        "ml": "ml",
        "cl": "ml",
        "dl": "ml",
        "l": "ml",
        "tsp": "ml",
        "tbsp": "ml",
        "dstspn": "ml",
        "cup": "ml",
        "quart": "ml",
        "gallon": "ml",
        "floz": "ml",
        "pint": "ml",
        "g": "g",
        "kg": "g",
        "oz": "g",
        "lb": "g",
        "pinch": "unit",
        "whole": "unit",
    }

    for unit, freq in quantity_units.items():
        if freq == "default":
            if unit in ("unit", "g", "ml"):
                return "unit" if unit == "whole" else unit
            else:
                return freq_substitutions.get(unit, "unit")  # Default to 'unit' if not found
    # Fallback if no 'default' is found, assume 'unit' or 'g' based on common patterns
    if "g" in quantity_units:
        return "g"
    if "ml" in quantity_units:
        return "ml"
    return "unit"  # Default fallback


def transform_unit_frequencies(quantity_units: dict) -> dict:
    """
    Transforms the quantity_units object into unit_frequencies matching the ENUM.
    """
    transformed = {}
    for unit, freq in quantity_units.items():
        # Map 'whole' to 'unit' for storage if it's not the base_unit
        display_unit = "unit" if unit == "whole" else unit
        transformed[display_unit] = COMMON_LEVEL_MAP.get(freq, "occasionally")  # Default to 'occasionally'
    return transformed


def phase1_insert_ingredients(ingredient_data_list: list):
    """
    Phase 1: Inserts main ingredient data into the 'ingredients' table.
    Populates ingredient_slug_to_id map.
    """
    print("\n--- Phase 1: Inserting main ingredient data ---")
    for i, ingredient_data in enumerate(ingredient_data_list):
        try:
            slug = ingredient_data["slug"]

            # CRITICAL WARNING FOR EMBEDDING DIMENSION
            if ingredient_data.get("embedding") and len(ingredient_data["embedding"]) != 1024:
                print(f"WARNING: Embedding for '{slug}' has {len(ingredient_data['embedding'])} dimensions. "
                      "Schema expects vector(1024). This will likely cause a database error unless handled.")
                # You might choose to truncate/pad here if that's your strategy:
                # ingredient_data["embedding"] = ingredient_data["embedding"][:384]
                # or raise ValueError("Embedding dimension mismatch!")

            data_to_insert = {
                "slug": slug,
                "slug_general": ingredient_data["generalSlug"],
                "aisle": ingredient_data.get("supermarketAisle"),  # ENUM type handles string directly
                "hierarchy": ingredient_data["hierarchy"],  # TEXT[] handles list of strings directly
                "base_unit": get_base_unit(ingredient_data["quantityUnits"]),
                "unit_frequencies": transform_unit_frequencies(ingredient_data["quantityUnits"]),
                "g_per_unit": ingredient_data.get("gPerUnit"),
                "g_per_ml": ingredient_data.get("density"),  # Renamed from 'density'
                "embedding": ingredient_data.get("embedding")
            }

            try:
                response = supabase.table("ingredients").insert(data_to_insert).execute()

                if response.data:
                    inserted_id = response.data[0]["id"]
                    ingredient_slug_to_id[slug] = inserted_id
                    # print(f"Inserted ingredient: {slug} (ID: {inserted_id})")
                else:
                    print(f"Failed to insert ingredient {slug}: {response.error}")
                    continue
            
            except Exception as e:
                # Probably a duplicate, try to fetch its ID to continue
                print(f"Attempting to fetch ID for existing slug: {slug}")
                fetch_response = supabase.table("ingredients").select("id").eq("slug", slug).single().execute()
                if fetch_response.data:
                    ingredient_slug_to_id[slug] = fetch_response.data["id"]
                    print(f"Fetched existing ID for {slug}: {ingredient_slug_to_id[slug]}")
                else:
                    print(f"Could not fetch ID for existing slug {slug}: {fetch_response.error}. Skipping.")

            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1} of {len(ingredient_data_list)} ingredients in Phase 1.")

        except Exception as e:
            print(f"An error occurred in Phase 1 for {slug}: {e}")
    print("Phase 1: Finished inserting main ingredient data.")

def phase1_get_ingredient_ids(ingredient_data_list: list):
    """Can be called when phase1 is already done, just get the IDs in one go."""
    print("\n--- Phase 1: Fetching existing ingredient IDs ---")
    response = supabase.table("ingredients").select("id, slug").limit(10000).execute()
    if response.data:
        for ingredient in response.data:
            ingredient_slug_to_id[ingredient["slug"]] = ingredient["id"]
        print(f"Fetched {len(ingredient_slug_to_id)} existing ingredient IDs.")
    else:
        print("No ingredients found in the 'ingredients' table. Please ensure it's populated.")
        print(response.error)
        exit()


def phase2_insert_translations(ingredient_data_list: list):
    """
    Phase 2: Inserts ingredient translation data into the 'ingredient_translations' table.
    """
    print("\n--- Phase 2: Inserting ingredient translations ---")
    translations_to_insert = []
    for i, ingredient_data in enumerate(ingredient_data_list):
        slug = ingredient_data["slug"]
        ingredient_id = ingredient_slug_to_id.get(slug)

        if not ingredient_id:
            print(f"Skipping translations for {slug}: Ingredient ID not found.")
            continue

        # Iterate over each language in the original JSON structure
        for lang_code, name_singular in ingredient_data["name"].items():
            language_id = language_code_to_id.get(lang_code)
            if not language_id:
                print(f"Skipping translation for {slug} in {lang_code}: Language ID not found.")
                continue

            name_plural = ingredient_data["name"].get("plural")  # Assuming plural is nested under 'name' object
            if not name_plural:  # Handle case where plural might be missing or under 'name' obj
                # Fallback to singular name if plural is not found directly or nested
                name_plural = ingredient_data["name"].get(lang_code, {}).get("plural") or name_singular

            name_general = ingredient_data["generalName"].get(lang_code)
            commonly_used_raw = ingredient_data["isCommonlyUsed"].get(lang_code)
            commonly_used = COMMON_LEVEL_MAP.get(commonly_used_raw, "occasionally")  # Default to 'occasionally'

            translations_to_insert.append(
                {
                    "ingredient_id": ingredient_id,
                    "language_id": language_id,
                    "name_singular": (
                        name_singular.get("singular") if isinstance(name_singular, dict) else name_singular
                    ),
                    "name_plural": name_plural.get("plural") if isinstance(name_plural, dict) else name_plural,
                    "name_general": name_general,
                    "commonly_used": commonly_used,
                }
            )

        if (i + 1) % 100 == 0:
            print(f"Prepared {i + 1} of {len(ingredient_data_list)} ingredients for translations in Phase 2.")

    # Perform bulk insert for translations
    if translations_to_insert:
        print(f"Attempting to insert {len(translations_to_insert)} translations in bulk...")
        try:
            # Supabase insert with upsert=True is useful for idempotency in bulk operations
            # However, for initial insert, simple insert is fine.
            # For 4000 ingredients, if each has 4 languages, that's 16000 translations.
            # Supabase has a default row limit of 1000 per insert. We need to chunk.
            chunk_size = 500
            for k in range(0, len(translations_to_insert), chunk_size):
                chunk = translations_to_insert[k : k + chunk_size]
                response = supabase.table("ingredient_translations").insert(chunk).execute()
                if response.data:
                    print(
                        f"Inserted chunk {k//chunk_size + 1}/{(len(translations_to_insert)-1)//chunk_size + 1} of translations."
                    )
                else:
                    print(f"Failed to insert chunk of translations (from {k} to {k+chunk_size}): {response.error}")
        except Exception as e:
            print(f"An error occurred during bulk insert of translations: {e}")

    print("Phase 2: Finished inserting ingredient translations.")


def phase3_insert_substitutions(ingredient_data_list: list):
    """
    Phase 3: Inserts ingredient substitution data into the 'ingredient_substitutions' table.
    """
    print("\n--- Phase 3: Inserting ingredient substitutions ---")
    substitutions_to_insert = []
    for i, ingredient_data in enumerate(ingredient_data_list):
        original_slug = ingredient_data["slug"]
        original_ingredient_id = ingredient_slug_to_id.get(original_slug)

        if not original_ingredient_id:
            print(f"Skipping substitutions for {original_slug}: Original ingredient ID not found.")
            continue

        substitutions = ingredient_data.get("substitutions", {})
        for strength_category, subs_map in substitutions.items():
            if strength_category in SUBSTITUTION_STRENGTH_MAP:
                strength = SUBSTITUTION_STRENGTH_MAP[strength_category]
                for substitute_slug, ratio in subs_map.items():
                    substitute_ingredient_id = ingredient_slug_to_id.get(substitute_slug)
                    if not substitute_ingredient_id:
                        print(
                            f"Skipping substitution for {original_slug} -> {substitute_slug}: Substitute ingredient ID not found (not yet inserted?)."
                        )
                        continue

                    substitutions_to_insert.append(
                        {
                            "original_ingredient_id": original_ingredient_id,
                            "substitute_ingredient_id": substitute_ingredient_id,
                            "strength": strength,
                            "original_to_substitute_ratio": float(ratio) if ratio else 1.0,
                        }
                    )
            elif strength_category == "variants":
                print(
                    f"Note: Skipping 'variants' type substitution for {original_slug} as it doesn't fit 'ingredient_substitution_strength' ENUM."
                )
            else:
                print(f"Warning: Unknown substitution strength category '{strength_category}' for {original_slug}.")

        if (i + 1) % 100 == 0:
            print(f"Prepared {i + 1} of {len(ingredient_data_list)} ingredients for substitutions in Phase 3.")

    # Perform bulk insert for substitutions
    if substitutions_to_insert:
        print(f"Attempting to insert {len(substitutions_to_insert)} substitutions in bulk...")
        try:
            chunk_size = 500
            for k in range(0, len(substitutions_to_insert), chunk_size):
                chunk = substitutions_to_insert[k : k + chunk_size]
                response = supabase.table("ingredient_substitutions").insert(chunk).execute()
                if response.data:
                    print(
                        f"Inserted chunk {k//chunk_size + 1}/{(len(substitutions_to_insert)-1)//chunk_size + 1} of substitutions."
                    )
                else:
                    print(f"Failed to insert chunk of substitutions (from {k} to {k+chunk_size}): {response.error}")
        except Exception as e:
            print(f"An error occurred during bulk insert of substitutions: {e}")

    print("Phase 3: Finished inserting ingredient substitutions.")


def main():
    """
    Orchestrates reading JSON files and inserting data into Supabase across phases.
    """
    if not os.path.exists(INGREDIENTS_FOLDER):
        print(f"Error: The folder '{INGREDIENTS_FOLDER}' does not exist.")
        print("Please ensure your ingredient JSON files are located in this folder.")
        return

    json_files = [f for f in os.listdir(INGREDIENTS_FOLDER) if f.endswith(".json")]
    if not json_files:
        print(f"No JSON files found in '{INGREDIENTS_FOLDER}'. Exiting.")
        return

    print(f"Found {len(json_files)} JSON files in '{INGREDIENTS_FOLDER}'. Starting data migration...")

    # Read all ingredient data first
    all_ingredients_data = []
    for filename in json_files:
        file_path = os.path.join(INGREDIENTS_FOLDER, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                ingredient_data = json.load(f)
                all_ingredients_data.append(ingredient_data)
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from file: {filename}. Skipping.")
        except Exception as e:
            print(f"An unexpected error occurred reading file {filename}: {e}")

    if not all_ingredients_data:
        print("No valid ingredient data to process. Exiting.")
        return

    # 1. Fetch language IDs
    fetch_language_ids()
    if not language_code_to_id:
        print("No language IDs available. Cannot proceed with translations. Exiting.")
        return

    # 2. Insert main ingredient records (Phase 1)
    phase1_insert_ingredients(all_ingredients_data)
    # phase1_get_ingredient_ids(all_ingredients_data)
    if not ingredient_slug_to_id:
        print("No ingredient IDs were successfully inserted or fetched. Cannot proceed with phases 2 and 3. Exiting.")
        return

    # 3. Insert translations (Phase 2)
    phase2_insert_translations(all_ingredients_data)

    # 4. Insert substitutions (Phase 3)
    phase3_insert_substitutions(all_ingredients_data)

    print("\nAll phases completed.")


if __name__ == "__main__":
    main()
