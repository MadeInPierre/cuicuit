"""
This script processes the ingredient documents generated in the previous step using Mistral LLM.
- It reads the ingredient documents from the 'data/ingredient/docs-mistral-raw' directory.
- It adds the category field to each ingredient.
- It embeds the substitution candidates for each ingredient and replaces it with the closest match.
- It saves the processed ingredient documents to the 'data/ingredients/docs' directory.
"""

import csv
import os
import json
import time
from typing import Callable, Dict, Set
from mistralai import Mistral
import pandas as pd
from sklearn.metrics.pairwise import euclidean_distances
from rich import print
from rich.table import Table
from rich.console import Console

client = Mistral(api_key="OKaYHYap391fb0jJQTcuJQCxev4l99Et")

DOCS_RAW_DIR = "data/ingredients/docs-mistral-raw"
DOCS_DEST_DIR = "data/ingredients/docs"
CATEGORIES_FILE = "data/matched_ingredients_reviewed.csv"
INGREDIENTS_EMBEDDINGS_FILE = "data/ingredient_embeddings.csv"
UNKNOWN_SUBSTITUTIONS_EMBEDDINGS_FILE = "data/unknown_substitutions_embeddings.csv"
MATCHED_INGREDIENTS_FILE = "data/matched_unknown_substitutions.csv"
MAX_DISTANCE = 0.41


###### Load ingredient documents and categories


def load_ingredient_docs():
    docs = {}
    for file in os.listdir(DOCS_RAW_DIR):
        slug = file.split(".")[0]
        with open(os.path.join(DOCS_RAW_DIR, file), "r") as f:
            docs[slug] = json.load(f)
    return docs


def load_categories():
    categories = {}
    with open(CATEGORIES_FILE, "r") as f:
        for line in f:
            slug, category = line.strip().split(",")
            categories[slug] = category
    return categories


docs = load_ingredient_docs()
categories = load_categories()


###### Process ingredient documents


n_known_substitutions, n_unknown_substitutions = 0, 0
known_substitutions: Dict[str, int] = {}
unknown_substitutions: Dict[str, int] = {}


# Validate and process ingredient documents
for slug, doc in load_ingredient_docs().items():
    # Add category
    doc["hierarchy"] = categories[slug].split("/")

    # Verify that the quantityUnits field has at least one unit with the "default" value
    if not any(unit == "default" for unit in doc["quantityUnits"].values()):
        print(f"[red]Missing default quantity unit for {slug}")

    # Match substitution candidates
    for group in doc["substitutions"]:
        for i, candidate_slug in enumerate(doc["substitutions"][group]):
            if candidate_slug in docs:
                known_substitutions[candidate_slug] = (
                    known_substitutions[candidate_slug] + 1 if candidate_slug in known_substitutions else 1
                )
                n_known_substitutions += 1
            else:
                # print(f"[red]Missing substitution candidate for {slug}: {candidate_slug}")
                unknown_substitutions[candidate_slug] = (
                    unknown_substitutions[candidate_slug] + 1 if candidate_slug in unknown_substitutions else 1
                )
                n_unknown_substitutions += 1


###### Display the top 10 most common known & unknown substitution candidates


def display_top_candidates(candidates: dict, title: str, n: int = 20):
    sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
    print(f"[bold]{title}[/bold]")
    for slug, count in sorted_candidates[:n]:
        print(f"  {count}\t{slug}")
    print()


display_top_candidates(
    known_substitutions,
    f"[green]Known slugs: {len(known_substitutions)} unique ({n_known_substitutions} total)",
    n=30,
)
display_top_candidates(
    unknown_substitutions,
    f"[red]Unknown slugs: {len(unknown_substitutions)} unique ({n_unknown_substitutions} total)",
    n=30,
)


###### Calculate embeddings for unknown substitution candidates


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


def prompt_ingredient(ingredient: str) -> str:
    return f"L'ingrédient alimentaire appelé '{ingredient}' peut être trouvé dans une catégorie de supermarché précise."


# Load the unknown substitutions embeddings if the file exists
if not os.path.exists(UNKNOWN_SUBSTITUTIONS_EMBEDDINGS_FILE):
    # Call the API to get embeddings if the file does not exist
    unknown_substitutions_slugs = list(unknown_substitutions.keys())
    unknown_substitutions_embeddings = get_embeddings_by_chunks(
        unknown_substitutions_slugs, prompt_ingredient, chunk_size=300
    )

    # Create a df with the slug and embeddings
    df_unknown_substitutions_embeddings = pd.DataFrame(
        {"slug": unknown_substitutions_slugs, "embedding": unknown_substitutions_embeddings}
    )
    df_unknown_substitutions_embeddings.to_csv(UNKNOWN_SUBSTITUTIONS_EMBEDDINGS_FILE, index=False)


##### Match unknown substitution candidates with existing ingredients


df_unknown_substitutions_embeddings = pd.read_csv(UNKNOWN_SUBSTITUTIONS_EMBEDDINGS_FILE)
df_existing_ingredient_embeddings = pd.read_csv(INGREDIENTS_EMBEDDINGS_FILE)


# Create a CSV file with the unknown substitutions, the closest match of existing ingredients, and the distance
def convert_to_float_array(serialized_string):
    return json.loads(serialized_string)


if not os.path.exists(MATCHED_INGREDIENTS_FILE):
    distances = euclidean_distances(
        df_unknown_substitutions_embeddings["embedding"].apply(convert_to_float_array).tolist(),
        df_existing_ingredient_embeddings["embedding"].apply(convert_to_float_array).tolist(),
    )

    closest_matches = []
    for i, row in df_unknown_substitutions_embeddings.iterrows():
        closest_match_indices = distances[i].argsort()[:3]
        closest_match_slugs = df_existing_ingredient_embeddings.iloc[closest_match_indices]["slug"].tolist()
        closest_match_distances = distances[i][closest_match_indices].tolist()
        closest_matches.append(
            (
                row["slug"],
                closest_match_slugs[0],
                closest_match_distances[0],
                closest_match_slugs[1],
                closest_match_distances[1],
                closest_match_slugs[2],
                closest_match_distances[2],
                0,
            )
        )

    df_closest_matches = pd.DataFrame(
        closest_matches,
        columns=[
            "unknown_slug",
            "closest_existing_slug_0",
            "distance_0",
            "closest_existing_slug_1",
            "distance_1",
            "closest_existing_slug_2",
            "distance_2",
            "i_replacement",
        ],
    )
    df_closest_matches.to_csv(MATCHED_INGREDIENTS_FILE, index=False)

df_closest_matches = pd.read_csv(MATCHED_INGREDIENTS_FILE)

# Print a rich table with the closest matches
table = Table(title="Top 100 Unknown Substitutions with Replacements")
table.add_column("#", justify="left", style="cyan", no_wrap=True)
table.add_column("Unknown Slug", justify="left", style="cyan", no_wrap=True)
table.add_column("Closest Existing Slug 0", justify="left", style="magenta")
table.add_column("Distance 0", justify="right", style="green")
table.add_column("Closest Existing Slug 1", justify="left", style="magenta")
table.add_column("Distance 1", justify="right", style="green")
table.add_column("Closest Existing Slug 2", justify="left", style="magenta")
table.add_column("Distance 2", justify="right", style="green")
table.add_column("Decision", justify="right", style="red")

sorted_unknown_substitutions = sorted(unknown_substitutions.items(), key=lambda x: x[1], reverse=True)[:100]
for slug, count in sorted_unknown_substitutions:
    match = df_closest_matches[df_closest_matches["unknown_slug"] == slug].values[0]
    table.add_row(
        f"{count}",
        match[0],
        match[1],
        f"{match[2]:.4f}" if match[2] < MAX_DISTANCE else f"[yellow]{match[2]:.4f}",
        match[3],
        f"{match[4]:.4f}" if match[4] < MAX_DISTANCE else f"[yellow]{match[4]:.4f}",
        match[5],
        f"{match[6]:.4f}" if match[6] < MAX_DISTANCE else f"[yellow]{match[6]:.4f}",
        f"{match[7]}",
    )

print(table)


# Replace the unknown substitution candidates with the closest match
for match in df_closest_matches.values:
    unknown_slug, i_decision = match[0], match[7]
    replacement_slug = match[1 + 2 * i_decision]

    if i_decision != 0:
        print(f"[yellow]Replacing '{unknown_slug}' with '{replacement_slug}' by manual decision {i_decision}")

    for slug, doc in docs.items():
        for group in doc["substitutions"]:
            changes = []
            for i, candidate_slug in enumerate(doc["substitutions"][group]):
                if candidate_slug == unknown_slug:
                    changes.append((replacement_slug, candidate_slug))

            for new_slug, old_slug in changes:
                doc["substitutions"][group][new_slug] = doc["substitutions"][group][old_slug]
                del doc["substitutions"][group][old_slug]

# Post-process the ingredient documents with the following rules:
# - Remove all substitutions that have the same slug as the ingredient
# - Remove all duplicate substitutions, keeping only the first one (i.e. prefer "equivalent" first then "similar", "far", and "variant" last)
groups = ["equivalent", "similar", "far", "variants"]

for slug, doc in docs.items():
    substitutions: Set[str] = set()
    for group in groups:
        group_substitutions = []
        for i, candidate_slug in enumerate(doc["substitutions"][group]):
            if candidate_slug != slug and candidate_slug not in substitutions:
                group_substitutions.append((candidate_slug, doc["substitutions"][group][candidate_slug]))
                substitutions.add(candidate_slug)
        doc["substitutions"][group] = dict(group_substitutions)


for slug, doc in docs.items():
    # Add the ingredient embeddings to the processed ingredient documents
    doc["embedding"] = (
        df_existing_ingredient_embeddings[df_existing_ingredient_embeddings["slug"] == slug]["embedding"]
        .apply(convert_to_float_array)
        .values[0]
    )

    # TODO TEMPORARY? Replace the slug (english generated by mistral) with the original slug (french)
    doc["slug"] = slug

    # Capitalize the first letter of the ingredient name (singular and plural for all languages)
    for lang in doc["name"]:
        if doc["name"][lang]["singular"]:
            doc["name"][lang]["singular"] = doc["name"][lang]["singular"].capitalize().replace("-", " ")
        else:
            doc["name"][lang]["singular"] = doc["slug"].replace("-", " ").capitalize()

        if doc["name"][lang]["plural"]:
            doc["name"][lang]["plural"] = doc["name"][lang]["plural"].capitalize().replace("-", " ")


# Save the processed ingredient documents
for slug, doc in docs.items():
    with open(os.path.join(DOCS_DEST_DIR, f"{slug}.json"), "w") as f:
        json.dump(doc, f, indent=4)
