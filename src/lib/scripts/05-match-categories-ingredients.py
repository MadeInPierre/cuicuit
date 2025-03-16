import json
from typing import Callable
import pandas as pd
import os
from mistralai import Mistral
import csv
import unidecode
from sklearn.metrics.pairwise import euclidean_distances
import time
import shutil


# Paths
CATEGORIES_FILE = "data/categories/categories_paths.txt"
INGREDIENTS_FOLDER = "data/ingredients/marmiton/"
OUTPUT_FILE = "data/matched_ingredients.csv"

client = Mistral(api_key="OKaYHYap391fb0jJQTcuJQCxev4l99Et")


# Call the API to get embeddings in chunks
def get_embeddings_by_chunks(data, promptFn: Callable[[str], str], chunk_size=500):
    promptedData = [promptFn(d) for d in data]
    chunks = [promptedData[x : x + chunk_size] for x in range(0, len(promptedData), chunk_size)]
    embeddings_response = []
    for i, c in enumerate(chunks):
        print(f"  Processing chunk {i+1}/{len(chunks)}...")
        time.sleep(5)
        embeddings_response.append(client.embeddings.create(model="mistral-embed", inputs=c))
    return [d.embedding for e in embeddings_response for d in e.data]


# Load categories from file
def load_categories(file_path):
    categories = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                # categories.append(os.path.basename(line))  # Extract last part of path
                categories.append(line)  # Extract last part of path
    return categories


# Normalize text (lowercase, remove accents, etc.)
def normalize_text(text):
    text = text.lower().replace("-", " ").replace("_", " ")  # Replace dashes/underscores with spaces
    text = unidecode.unidecode(text)  # Remove accents (é → e)
    return text.strip()


# # Load ingredient names from filenames
def load_ingredients(folder_path):
    ingredients = []
    for filename in os.listdir(folder_path):
        if filename.endswith((".jpg", ".png", ".jpeg")):
            ingredient_name = os.path.splitext(filename)[0]
            ingredients.append(ingredient_name)
    return ingredients


def prompt_ingredient(ingredient: str) -> str:
    return f"L'ingrédient alimentaire appelé '{ingredient}' peut être trouvé dans une catégorie de supermarché précise."


def prompt_category(category: str) -> str:
    return f"Ceci est une catégorie de supermarché (hiérarchie allant du plus général au plus précis) : {category}"


def generate_embeddings():
    print("Loading categories...")
    categories = load_categories(CATEGORIES_FILE)
    print(categories[:3], sep="\n")

    print("Loading ingredient images...")
    ingredients = load_ingredients(INGREDIENTS_FOLDER)

    print("Calculating embeddings for ingredients...")
    ingredient_embeddings = get_embeddings_by_chunks(ingredients, prompt_ingredient)
    df_ingredient_embeddings = pd.DataFrame({"slug": ingredients, "embedding": ingredient_embeddings})
    df_ingredient_embeddings.to_csv("data/ingredient_embeddings.csv", index=False)

    print("Calculating embeddings for categories...")
    category_embeddings = get_embeddings_by_chunks(categories, prompt_category, chunk_size=100)
    df_category_embeddings = pd.DataFrame({"slug": categories, "embedding": category_embeddings})
    df_category_embeddings.to_csv("data/category_embeddings.csv", index=False)


# Main execution
if __name__ == "__main__":
    # print("Generating embeddings...")
    # generate_embeddings()

    print("Loading saved embeddings...")
    df_ingredient_embeddings = pd.read_csv("data/ingredient_embeddings.csv")
    df_category_embeddings = pd.read_csv("data/category_embeddings.csv")

    # Remove categories that contain "dietetique"
    df_category_embeddings = df_category_embeddings[~df_category_embeddings["slug"].str.contains("dietetique")]

    print("Calculating distance matrix...")

    def convert_to_float_array(serialized_string):
        return json.loads(serialized_string)

    distances = euclidean_distances(
        df_ingredient_embeddings["embedding"].apply(convert_to_float_array).tolist(),
        df_category_embeddings[df_category_embeddings["slug"].str.startswith("food/")]["embedding"]
        .apply(convert_to_float_array)
        .tolist(),
    )

    print("Matching ingredients to categories...")
    matched_results = []
    for i, row in df_ingredient_embeddings.iterrows():
        best_match_indices = distances[i].argsort()[:5]
        matched_results.append(
            [
                row["slug"],
                df_category_embeddings.iloc[best_match_indices[0]]["slug"],
                1 - distances[i][best_match_indices[0]],
                df_category_embeddings.iloc[best_match_indices[1]]["slug"],
                1 - distances[i][best_match_indices[1]],
                df_category_embeddings.iloc[best_match_indices[2]]["slug"],
                1 - distances[i][best_match_indices[2]],
                df_category_embeddings.iloc[best_match_indices[3]]["slug"],
                1 - distances[i][best_match_indices[3]],
                df_category_embeddings.iloc[best_match_indices[4]]["slug"],
                1 - distances[i][best_match_indices[4]],
            ]
        )

    print("Saving results...")
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(matched_results)

    # print("Copying image files to matched categories...")
    # for row in matched_results:
    #     ingredient_name, category_name = row[0], row[1]
    #     ingredient_image_path = os.path.join(INGREDIENTS_FOLDER, f"{ingredient_name}.jpg")
    #     category_image_path = os.path.join("data/categories", category_name, f"{ingredient_name}.jpg")

    #     os.makedirs(os.path.dirname(category_image_path), exist_ok=True)
    #     if os.path.exists(ingredient_image_path):
    #         shutil.copy(ingredient_image_path, category_image_path)
    #     else:
    #         print(f"Image not found for ingredient: {ingredient_name}")
