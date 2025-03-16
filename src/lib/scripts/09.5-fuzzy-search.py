"""
This script uses the fuzzy search algorithm to find the closest match for each ingredient name in the target language.
It is an interactive proof of concept to show how the fuzzy search algorithm works.
A user can input a language and then an ingredient name in that language.
The script will return the closest match in the English language.

The ingredient input is interactive, meaning that every key press will update the search results.
"""

import json
from fuzzywuzzy import process
from rich import print
import heapq
import time


INGREDIENTS_LISTS_FOLDER = "data/ingredients/lists"
LANGUAGES = ["en-US", "fr-FR", "es-ES", "pt-BR"]

# Load the ingredients lists per language
lang = input("Enter the language (en-US, fr-FR, es-ES, pt-BR): ")
lang = lang if lang and lang in LANGUAGES else "fr-FR"

ingredients_list = {}
with open(f"{INGREDIENTS_LISTS_FOLDER}/ingredients-{lang}.json", "r") as f:
    ingredients_list = json.load(f)


def custom_scorer(input_str, choice_singular, is_commonly_used):
    """Custom scoring function to prefer matches that start with input_str, are shorter, and commonly used."""

    # Boost score if the choice is an exact match
    if choice_singular == input_str:
        return 1000

    input_str = input_str.casefold()
    choice_singular = choice_singular.casefold()

    # Compute base fuzzy match score once
    fuzz_score = process.fuzz.ratio(input_str, choice_singular)

    # Boost score if the choice starts with input_str
    if choice_singular.startswith(input_str):
        fuzz_score += 50

    # Boost score if the choice contains input_str
    if input_str in choice_singular:
        fuzz_score += 50

    # Boost score if the ingredient is commonly used
    fuzz_score += is_commonly_used * 20

    # Penalize longer ingredient names
    fuzz_score -= len(choice_singular) - len(input_str)

    return fuzz_score


def top_matches(input_str, ingredient_list, top_n=10):
    """Find the top N closest matching ingredients using optimized scoring and heapq for speed."""

    # Compute scores for all ingredients
    scored_matches = [
        (
            choice,
            custom_scorer(input_str, choice["singular"], choice["isCommonlyUsed"]),
        )
        for choice in ingredient_list
    ]

    # Use heapq.nlargest for faster top-N selection
    return heapq.nlargest(top_n, scored_matches, key=lambda x: x[1])


# Ingredient search loop
while True:
    ingredient_name = input("\n\nEnter the ingredient name: ").strip()

    # Perform fuzzy search
    start_time = time.time()
    matches = top_matches(ingredient_name, ingredients_list.values())

    print(f"Search time: {1000 * (time.time() - start_time):.4f} ms")
    for rank, (match, score) in enumerate(matches, start=1):
        print(f"  {rank}. [green]{match['singular']}[/] (Score: {score}, Commonly Used: {match['isCommonlyUsed']})")
