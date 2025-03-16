"""
This script loads the Carrefour categories from the file
`ingredients/carrefour_raw.json` taken using carrefour.fr's Developer Tools
and only keeps the necessary fields, then saves the result
to `ingredients/categories.json`. It also downloads the category images
to the corresponding folders in `data/categories/...`. Finally, it saves
the paths of all the leaf categories to `data/categories/paths.txt`.
"""

import json
import os
from typing import List
import requests

DOWNLOAD_IMAGES = False


# Load the Carrefour categories
with open("data/categories/carrefour_raw.json", "r") as f:
    carrefour_categories = json.load(f)["tree"]


paths: List[str] = []


def tidyCategory(category, section):
    # Create an empty folder for it in data/carrefour/...
    hierarchy = category["link"].replace("\\", "").replace("http://carrefour.fr", "").split("?")[0]
    if hierarchy.startswith("/r/"):
        hierarchy = hierarchy[3:]
    if not hierarchy.endswith("/" + category["slug"]):
        hierarchy += "/" + category["slug"]

    folderPath = f"data/categories/{section}/{hierarchy}"

    os.makedirs(folderPath, exist_ok=True)

    hasChildren = "children" in category and category["children"] and len(category["children"]) > 0

    result = {
        "name": category["name"],
        "slug": category["slug"],
        # "section": section,
        # "type": "category" if hasChildren else "leaf",
        "hierarchy": hierarchy.split("/"),
    }

    if "picto" in category and category["picto"]:
        result["image"] = True

        # Download the image and save it to the folder
        if DOWNLOAD_IMAGES:
            image = requests.get(category["picto"])
            with open(folderPath + "/image.png", "wb") as f:
                f.write(image.content)

    if hasChildren:
        result["children"] = [tidyCategory(child, section) for child in category["children"]]
    else:
        paths.append(section + "/" + hierarchy)
        # paths.append(category["slug"])

    return result


# Print top categories
print([c["name"] for c in carrefour_categories])
topCategoriesSections = {
    # Remove these categories from the final output
    "Promotions": None,
    "Ramadan": None,
    "Produits r\u00e9gionaux et locaux": None,
    "Bio et Ecologie": None,
    "category.code.CATALOGUES": None,
    "Act for Food": None,
    "Foire aux vins": None,
    " Nos petits prix du quotidien": None,
    "Nouveautés et Précommandes": None,
    "Nouveautés": None,
    "Nos recettes": None,
    "Produits régionaux et locaux": None,
    "Mon marché frais": None,
    "Bio et Ecologie": None,
    "Services": None,
    "Commande Traiteur": None,
    # Food
    "Fruits et Légumes": "food",
    "Viandes et Poissons": "food",
    "Pains et Pâtisseries": "food",
    "Crèmerie et Produits laitiers": "food",
    "Charcuterie et Traiteur": "food",
    "Surgelés": "food",
    "Boissons": "food",
    "Epicerie salée": "food",
    "Epicerie sucrée": "food",
    "Produits du monde": "food",
    "Nutrition et Végétale": "food",
    # Non-food
    "Bébé": "non-food",
    "Hygiène et Beauté": "non-food",
    "Entretien et Nettoyage": "non-food",
    "Animalerie": "non-food",
    "Jardin": "non-food",
    "Maison et Décoration": "non-food",
    "Jeux vidéo": "non-food",
    "Smartphones et Objets connectés": "non-food",
    "Informatique et Bureau": "non-food",
    "Image et Son": "non-food",
    "Cuisine": "non-food",
    "Entretien de la Maison": "non-food",
    "Beauté et Santé": "non-food",
    "Gros Electroménager": "non-food",
    "Jeux et Jouets": "non-food",
    "Vélos, Trottinettes et Loisirs": "non-food",
    "Mode et Bagagerie": "non-food",
    "Bricolage": "non-food",
    "Auto et Moto": "non-food",
    "Bébé et Puériculture": "non-food",
    "Livres et Culture": "non-food",
}

# Tidy the categories
carrefour_categories_tidy = [
    tidyCategory(c, section=topCategoriesSections[c["name"]])
    for c in carrefour_categories
    if topCategoriesSections[c["name"]] is not None
]

# Save the result
with open("data/categories/categories.json", "w") as f:
    json.dump(carrefour_categories_tidy, f, indent=2)

with open("data/categories/paths.txt", "w") as f:
    paths.sort()  # Sort paths alphabetically
    f.write("\n".join(paths))
