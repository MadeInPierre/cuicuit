"""
This script generates one json file per language to list all the ingredients with slugs and names in that language.
The json files are stored in the `data/ingredients/lang` folder.
"""

import os
import json

INGREDIENTS_DOCS_FOLDER = "data/ingredients/docs"
LANGUAGES = ["en-US", "fr-FR", "es-ES", "pt-BR"]

IS_COMMONLY_USED_MAP = {
    "daily": 4,
    "common": 3,
    "occasionally": 2,
    "rare": 1,
    "never": 0,
}

# Build the list of ingredients from the document files (filename is the slug)
ingredients = []
for filename in os.listdir(INGREDIENTS_DOCS_FOLDER):
    with open(f"{INGREDIENTS_DOCS_FOLDER}/{filename}", "r") as f:
        ingredient = json.load(f)
        ingredients.append(ingredient)

print(f"Loaded {len(ingredients)} ingredients")

# Generate the ingredients lists per language
os.makedirs("data/ingredients/lists", exist_ok=True)

for lang in LANGUAGES:
    ingredients_list = {}
    for ingredient in ingredients:
        ingredients_list[ingredient["slug"]] = {
            "singular": ingredient["name"][lang]["singular"],
            "plural": ingredient["name"][lang]["plural"],
            "isCommonlyUsed": IS_COMMONLY_USED_MAP[ingredient["isCommonlyUsed"][lang]],
        }

        # ingredients_list[ingredient["slug"]] = ingredient["name"][lang]["singular"]

    with open(f"data/ingredients/lists/ingredients-{lang}.json", "w") as f:
        json.dump(ingredients_list, f, indent=2)

    print(f"Saved data/ingredients/lists/ingredients-{lang}.json")
