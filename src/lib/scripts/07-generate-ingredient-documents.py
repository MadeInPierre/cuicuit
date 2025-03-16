"""
This script moves the ingredients from the `data/ingredients` folder to the
`data/categories/food` folder based on the reviewed matches in the
`data/matched_ingredients_reviewed.csv` file. It also copies the images
from the `data/ingredients/marmiton` folder to the corresponding category
folders in `data/categories/food/...` based on the reviewed matches.
"""

import csv
import os
import shutil
import time
from typing import Dict
from mistralai import Mistral
from rich import print
from requests import post


def alarm(color: str):
    rgb = [255, 255, 255]
    if color == "red":
        rgb = [255, 0, 0]
    elif color == "green":
        rgb = [0, 255, 0]
    elif color == "yellow":
        rgb = [255, 255, 0]

    post(
        "http://192.168.1.121:8123/api/services/light/turn_on",
        headers={
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzNmI4NzY2ZjU2ZjM0Y2EzODcyMjRkNDg0NjJjNzRiNCIsImlhdCI6MTc0MjA2ODQ3MywiZXhwIjoyMDU3NDI4NDczfQ.tFjEmQ3s9M6pBJWjVisxSHdtV5qNTg3_PRbYLg0NyEk",
            "content-type": "application/json",
        },
        json={
            "entity_id": "light.led_bulb_w509z2",
            "rgb_color": rgb,
            "brightness": 255,
        },
    )


# Paths
INGREDIENTS_FOLDER = "data/ingredients/marmiton/"
CATEGORIES_FOLDER = "data/categories/"
MATCHES_FILE = "data/matched_ingredients_reviewed.csv"
DOCS_FOLDER = "data/ingredients/docs-mistral-raw/"

client = Mistral(api_key="OKaYHYap391fb0jJQTcuJQCxev4l99Et")

INGREDIENT_DOC_PROMPT = """You are a pro cooking chef and expert about cooking ingredients. Here is an ingredient in French: 
- Name: "{ingredient}"
- Supermarket category: "{category}"

Please output a JSON object following the typescript comments for directions and the typescript type for the JSON structure:

// This is a model for an ingredient in a recipe app. It has:
//   - A name in multiple languages with a singular and plural form in each language
//   - A unique identifier for this ingredient, in english and kebab-case
//   - The general name of this ingredient (e.g. "onion" for "red onion", "white onion", "yellow onion", etc.)
//   - The unique identifier for the general name of this ingredient, in english and kebab-case
//   - The aisle in the supermarket where this ingredient can be most commonly found
//   - For every quantity unit, a classification if it is common to use this ingredient with this unit (default, common, uncommon, rare, never)
//     - "default" means that the unit is the most common one for this ingredient. MAKE SURE TO HAVE AT LEAST ONE UNIT WITH "default" FOR EACH INGREDIENT
//     - "common" means that the unit is often used for this ingredient
//     - "uncommon" means that the unit is sometimes used for this ingredient
//     - "rare" means that the unit is rarely used for this ingredient
//     - "never" means that the unit is never used for this ingredient
//   - The weight in grams of one unit of this ingredient, with a minimum, default and maximum value
//   - The density of this ingredient in g/ml
//   - The energy in kilocalories per 100g of this ingredient
//   - A list of ingredients slugs (in French) that can be used as a substitute for this ingredient, with a weight ratio between this ingredient and the substitute
type Ingredient = {
    name: {
        "fr-FR": {
            singular: string | null; // Null if the singular form is never used in recipes for this ingredient
            plural: string | null; // Null if the plural form is never used in recipes for this ingredient
        };
        "en-US": {
            singular: string | null;
            plural: string | null;
        };
        "pt-BR": {
            singular: string | null;
            plural: string | null;
        };
        "es-ES": {
            singular: string | null;
            plural: string | null;
        };
    };
    slug: string; // The unique identifier for this ingredient, in english and kebab-case (e.g. "butter", "olive-oil", "chicken-breast")
    generalName: {
        // The general name of this ingredient (e.g. "onion" for "red onion", "white onion", "yellow onion", etc.)
        "fr-FR": string;
        "en-US": string;
        "pt-BR": string;
        "es-ES": string;
    };
    generalSlug: string; // The unique identifier for the general name of this ingredient, in english and kebab-case (e.g. "onion")
    supermarketAisle: "beverages"  | "bread-pastries" | "care-health" | "frozen-convenience" | "fruits-vegetables" | "grain-products" | "home-garden" | "household" | "ingredients-spices" | "meat-fish" | "milk-cheese" | "pet-supplies" | "snacks-sweets" | "unknown"; // The aisle in the supermarket where this ingredient can be most commonly found
    isCommonlyUsed: {
        // The general frequency of use of this ingredient in recipes in each country
        "fr-FR": "daily" | "common" | "occasionally" | "rare" | "never";
        "en-US": "daily" | "common" | "occasionally" | "rare" | "never";
        "pt-BR": "daily" | "common" | "occasionally" | "rare" | "never";
        "es-ES": "daily" | "common" | "occasionally" | "rare" | "never";
    };
    quantityUnits: {
        ml: "default" | "common" | "uncommon" | "rare" | "never";
        cl: "default" | "common" | "uncommon" | "rare" | "never";
        dl: "default" | "common" | "uncommon" | "rare" | "never";
        l: "default" | "common" | "uncommon" | "rare" | "never";
        tsp: "default" | "common" | "uncommon" | "rare" | "never";
        tbsp: "default" | "common" | "uncommon" | "rare" | "never";
        dstspn: "default" | "common" | "uncommon" | "rare" | "never";
        cup: "default" | "common" | "uncommon" | "rare" | "never";
        quart: "default" | "common" | "uncommon" | "rare" | "never";
        gallon: "default" | "common" | "uncommon" | "rare" | "never";
        floz: "default" | "common" | "uncommon" | "rare" | "never";
        pint: "default" | "common" | "uncommon" | "rare" | "never";
        g: "default" | "common" | "uncommon" | "rare" | "never";
        kg: "default" | "common" | "uncommon" | "rare" | "never";
        oz: "default" | "common" | "uncommon" | "rare" | "never";
        lb: "default" | "common" | "uncommon" | "rare" | "never";
        pinch: "default" | "common" | "uncommon" | "rare" | "never"; // for ingredients that can be used in very small quantities
        whole: "default" | "common" | "uncommon" | "rare" | "never"; // for countable ingredients eggs, tomatoes, etc.
    };
    gPerUnit: {
        // the weight in grams of one unit of this ingredient, null if the ingredient is not countable
        small: number; // The weight in grams of one small unit of this ingredient, but still commonly found in supermarkets
        medium: number; // The weight in grams of one common unit of this ingredient, most commonly found in supermarkets
        large: number; // The weight in grams of one large unit of this ingredient, but still commonly found in supermarkets
    } | null; // null if the ingredient is not countable
    density: number | null; // the density of this ingredient in g/ml, null if the density is not applicable
    kcalPer100g: number | null; // the energy in kilocalories per 100g of this ingredient
    substitutions: {
        // Ingredients that can be used as a substitute for this ingredient. Slugs must be in French.
        equivalent: {
            // Ingredients that are equivalent to this ingredient in recipes, they can be used as a substitute in most recipes without changing the taste or texture
            [slug: string]: number; // The weight ratio between this ingredient and the substitute, e.g. 1.0 means 100g of butter can be replaced by 100g of margarine
        };
        similar: {
            // Ingredients that are similar to this ingredient, they can be used as a substitute in some recipes without changing the taste or texture
            [slug: string]: number; // Same as above
        };
        far: {
            // Ingredients that are far from this ingredient, they could be used as a substitute in some recipes but the taste or texture might be different
            [slug: string]: number; // Same as above
        };
        variants: {
            // Ingredients that completely change the taste or texture of the recipe, but could still be used as a substitute in some recipes
            [slug: string]: number; // Same as above
        };
    };
};

Respond only with pure JSON."""


# Load reviewed
def load_reviewed(file_path: str) -> Dict[str, str]:
    if not os.path.exists(file_path):
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        return {rows[0]: rows[1] for rows in reader}  # Dictionary of ingredient -> category


def generate_doc(ingredient: str, category: str):
    print("  Generating document with Mistral API...")
    chat_response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {
                "role": "user",
                "content": INGREDIENT_DOC_PROMPT.replace("{ingredient}", ingredient).replace("{category}", category),
            }
        ],
        response_format={"type": "json_object"},
        temperature=0,
        timeout_ms=20000,
    )

    print(
        "  Tokens used: ",
        chat_response.usage.prompt_tokens,
        "+",
        chat_response.usage.completion_tokens,
        "=",
        chat_response.usage.total_tokens,
    )

    if chat_response.choices:
        print(chat_response.choices[0].message.content)
        with open(os.path.join(DOCS_FOLDER, ingredient + ".mistral-raw.json"), "w", encoding="utf-8") as f:
            f.write(str(chat_response.choices[0].message.content))
    else:
        print("  Invalid response")
        raise Exception("Invalid response")


reviewed = load_reviewed(MATCHES_FILE)

for index, (ingredient, category) in enumerate(reviewed.items(), start=1):
    print(f"\n\n\n######### {index}/{len(reviewed)} {ingredient} - {category}")

    category_path = os.path.join(CATEGORIES_FOLDER, category, ingredient + ".jpg")
    print("  Copying image to", category_path)
    ingredient_path = os.path.join(INGREDIENTS_FOLDER, ingredient + ".jpg")
    if os.path.exists(ingredient_path):
        os.makedirs(os.path.dirname(category_path), exist_ok=True)
        shutil.copy(ingredient_path, category_path)
    else:
        print(f"Ingredient not found: {ingredient}")
        exit(1)

    # Generate document if the JSON file does not exist
    if os.path.exists(os.path.join(DOCS_FOLDER, ingredient + ".mistral-raw.json")):
        print("  JSON file already exists")
        continue
    else:
        # generate_doc(ingredient, category)

        done = False
        while not done:
            try:
                alarm("yellow")
                generate_doc(ingredient, category)
                alarm("green")
                time.sleep(1.1)
                done = True
            except Exception as e:
                print("[red]  Error:", e)
                alarm("red")
                print("  Retrying in 10 seconds...")
                time.sleep(10)
