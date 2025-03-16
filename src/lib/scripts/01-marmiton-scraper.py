"""
This script scrapes the Marmiton website to get all the ingredients
from their public index page and their images.
"""

from urllib.request import urlopen
from rich import print_json, print
import json
from bs4 import BeautifulSoup
import os
import requests

alphabet = [chr(letter) for letter in range(97, 123)]


def get_recipes():
    INGREDIENTS = {}

    for letter in alphabet:
        for page in range(1, 15):
            try:
                url = f"https://www.marmiton.org/recettes/index/ingredient/{letter}/{page}"
                html = urlopen(url).read().decode("utf-8")  # retrieves the recipe webpage HTML
                soup = BeautifulSoup(html, "html.parser")

                ingredients = [
                    c
                    for c in soup.find("html")
                    .find("body")
                    .find("div", class_="marmiton")
                    .find("div", class_="recipe-search__resuts")
                    .find("div", class_="recipe-search__col-left")
                    .find("div", class_="padded-content")
                    .find("div", class_="recipe-results fix-inline-block")
                    .find_all("div", class_="index-item-card")
                ]

                for i in ingredients:
                    print("Link", i.find("a")["href"])
                    print("Image", i.find("img")["src"])
                    print("Name", i.text.strip(), "\n")

                    INGREDIENTS[i.text.strip()] = {
                        "link": i.find("a")["href"],
                        "image": i.find("img")["src"],
                    }
            except Exception as e:
                print(e)
                # expected, the page does not exist, go to the next letter
                break

        # Save the ingredients to a JSON file
        with open(f"marmiton_ingredients_{letter}.json", "w", encoding="utf-8") as f:
            json.dump(INGREDIENTS, f)


# Join all files into one
all_ingredients = {}
for letter in alphabet:
    with open(f"marmiton_ingredients_{letter}.json", "r") as f:
        letter_ingredients = json.load(f)
        NEW_INGREDIENTS = {}

        for key in letter_ingredients:
            if (
                letter_ingredients[key]["image"]
                == "https://assets.afcdn.com/recipe/20100101/ingredient_default_w200h200c1.jpg"
            ):
                letter_ingredients[key]["image"] = None

            letter_ingredients[key]["slug"] = letter_ingredients[key]["link"].split("/")[-1]

            NEW_INGREDIENTS[letter_ingredients[key]["slug"]] = {
                "name": key,
                "image": letter_ingredients[key]["image"],
            }

        all_ingredients.update(NEW_INGREDIENTS)

# Save the ingredients to a JSON file
with open("marmiton_ingredients.json", "w", encoding="utf-8") as f:
    json.dump(all_ingredients, f, ensure_ascii=False)

# Download the images
os.makedirs("marmiton_images", exist_ok=True)
for key in all_ingredients:
    if all_ingredients[key]["image"]:
        try:
            response = requests.get(all_ingredients[key]["image"])
            response.raise_for_status()
            with open(f"marmiton_images/{key}.jpg", "wb") as out_file:
                out_file.write(response.content)
        except requests.exceptions.HTTPError as e:
            print(all_ingredients[key]["image"], e)
            continue


# Some images were saved as 0 byte files, find them in the local folder and download them again
failed_images = [
    "/home/jack/Downloads/marmiton_images/yaourt-aromatise.jpg",
    "/home/jack/Downloads/marmiton_images/vin-rose.jpg",
    "/home/jack/Downloads/marmiton_images/vinaigre-de-vin.jpg",
    "/home/jack/Downloads/marmiton_images/turbot.jpg",
    "/home/jack/Downloads/marmiton_images/topinambour.jpg",
    "/home/jack/Downloads/marmiton_images/tomates-sechees.jpg",
    "/home/jack/Downloads/marmiton_images/tomates-confites-a-l-huile.jpg",
    "/home/jack/Downloads/marmiton_images/tofu.jpg",
    "/home/jack/Downloads/marmiton_images/sucrine.jpg",
    "/home/jack/Downloads/marmiton_images/sucre-semoule.jpg",
    "/home/jack/Downloads/marmiton_images/sucre-en-poudre.jpg",
    "/home/jack/Downloads/marmiton_images/sucre.jpg",
    "/home/jack/Downloads/marmiton_images/steak-hache.jpg",
    "/home/jack/Downloads/marmiton_images/spigol.jpg",
    "/home/jack/Downloads/marmiton_images/spatzle.jpg",
    "/home/jack/Downloads/marmiton_images/spaghettini.jpg",
    "/home/jack/Downloads/marmiton_images/spaghetti.jpg",
    "/home/jack/Downloads/marmiton_images/sorbet-mirabelle.jpg",
    "/home/jack/Downloads/marmiton_images/sorbet-ananas.jpg",
    "/home/jack/Downloads/marmiton_images/skyr.jpg",
    "/home/jack/Downloads/marmiton_images/semoule-fine.jpg",
    "/home/jack/Downloads/marmiton_images/sel-fin.jpg",
    "/home/jack/Downloads/marmiton_images/saucisse-de-strasbourg.jpg",
    "/home/jack/Downloads/marmiton_images/sauce-yakitori.jpg",
    "/home/jack/Downloads/marmiton_images/sauce-hamburger.jpg",
    "/home/jack/Downloads/marmiton_images/sauce-d-huitre.jpg",
    "/home/jack/Downloads/marmiton_images/rumsteck.jpg",
    "/home/jack/Downloads/marmiton_images/roti-de-porc.jpg",
    "/home/jack/Downloads/marmiton_images/roti-de-boeuf.jpg",
    "/home/jack/Downloads/marmiton_images/roquefort.jpg",
    "/home/jack/Downloads/marmiton_images/romaine.jpg",
    "/home/jack/Downloads/marmiton_images/riz-thai.jpg",
    "/home/jack/Downloads/marmiton_images/quatre-epices.jpg",
    "/home/jack/Downloads/marmiton_images/puree-de-tomate.jpg",
    "/home/jack/Downloads/marmiton_images/pulpe-de-tomate.jpg",
    "/home/jack/Downloads/marmiton_images/poule.jpg",
    "/home/jack/Downloads/marmiton_images/poivre-en-grains.jpg",
    "/home/jack/Downloads/marmiton_images/poivre-cubebe-ou-a-queue.jpg",
    "/home/jack/Downloads/marmiton_images/poivre-blanc.jpg",
    "/home/jack/Downloads/marmiton_images/poire-au-sirop.jpg",
    "/home/jack/Downloads/marmiton_images/piccalilli.jpg",
    "/home/jack/Downloads/marmiton_images/pate-d-arachide.jpg",
    "/home/jack/Downloads/marmiton_images/pate-brisee.jpg",
    "/home/jack/Downloads/marmiton_images/pate-a-pain.jpg",
    "/home/jack/Downloads/marmiton_images/panko-chapelure-japonaise.jpg",
    "/home/jack/Downloads/marmiton_images/pain-indien-naan.jpg",
    "/home/jack/Downloads/marmiton_images/ormeau.jpg",
    "/home/jack/Downloads/marmiton_images/orge.jpg",
    "/home/jack/Downloads/marmiton_images/orange.jpg",
    "/home/jack/Downloads/marmiton_images/oignons-frits.jpg",
    "/home/jack/Downloads/marmiton_images/nuoc-mam.jpg",
    "/home/jack/Downloads/marmiton_images/nouilles-udon.jpg",
    "/home/jack/Downloads/marmiton_images/nopal.jpg",
    "/home/jack/Downloads/marmiton_images/noix-de-saint-jacques.jpg",
    "/home/jack/Downloads/marmiton_images/noix.jpg",
    "/home/jack/Downloads/marmiton_images/myrtilles.jpg",
    "/home/jack/Downloads/marmiton_images/mozzarella-di-buffala.jpg",
    "/home/jack/Downloads/marmiton_images/mouton.jpg",
    "/home/jack/Downloads/marmiton_images/moutarde-de-meaux.jpg",
    "/home/jack/Downloads/marmiton_images/moutarde.jpg",
    "/home/jack/Downloads/marmiton_images/miettes-de-crabe.jpg",
    "/home/jack/Downloads/marmiton_images/merlan.jpg",
    "/home/jack/Downloads/marmiton_images/melange-poivre-5-baies.jpg",
    "/home/jack/Downloads/marmiton_images/maroilles.jpg",
    "/home/jack/Downloads/marmiton_images/marmelade-d-orange.jpg",
    "/home/jack/Downloads/marmiton_images/mandarine.jpg",
    "/home/jack/Downloads/marmiton_images/macedoine.jpg",
    "/home/jack/Downloads/marmiton_images/longanisse.jpg",
    "/home/jack/Downloads/marmiton_images/liveche.jpg",
    "/home/jack/Downloads/marmiton_images/litchi-au-sirop.jpg",
    "/home/jack/Downloads/marmiton_images/liqueur.jpg",
    "/home/jack/Downloads/marmiton_images/legumes.jpg",
    "/home/jack/Downloads/marmiton_images/langue.jpg",
    "/home/jack/Downloads/marmiton_images/langoustine.jpg",
    "/home/jack/Downloads/marmiton_images/langouste.jpg",
    "/home/jack/Downloads/marmiton_images/kumquat.jpg",
    "/home/jack/Downloads/marmiton_images/krisprolls.jpg",
    "/home/jack/Downloads/marmiton_images/knacki.jpg",
    "/home/jack/Downloads/marmiton_images/kefir.jpg",
    "/home/jack/Downloads/marmiton_images/jus-de-fruits-rouges.jpg",
    "/home/jack/Downloads/marmiton_images/jus-de-fruit-multivitamine.jpg",
    "/home/jack/Downloads/marmiton_images/jambonneau.jpg",
    "/home/jack/Downloads/marmiton_images/jambon-blanc.jpg",
    "/home/jack/Downloads/marmiton_images/iceberg.jpg",
    "/home/jack/Downloads/marmiton_images/huile-vegetale.jpg",
    "/home/jack/Downloads/marmiton_images/huile-d-olive.jpg",
    "/home/jack/Downloads/marmiton_images/haricots-noirs.jpg",
    "/home/jack/Downloads/marmiton_images/haricots-blancs.jpg",
    "/home/jack/Downloads/marmiton_images/haricot-mange-tout.jpg",
    "/home/jack/Downloads/marmiton_images/haricot.jpg",
    "/home/jack/Downloads/marmiton_images/gruyere-suisse.jpg",
    "/home/jack/Downloads/marmiton_images/gruyere-rape.jpg",
    "/home/jack/Downloads/marmiton_images/grenadine.jpg",
    "/home/jack/Downloads/marmiton_images/graisse-de-canard.jpg",
    "/home/jack/Downloads/marmiton_images/graines-de-courge.jpg",
    "/home/jack/Downloads/marmiton_images/goyave.jpg",
    "/home/jack/Downloads/marmiton_images/glace-coco.jpg",
    "/home/jack/Downloads/marmiton_images/glace-caramel-au-beurre-sale.jpg",
    "/home/jack/Downloads/marmiton_images/glace-au-chocolat.jpg",
    "/home/jack/Downloads/marmiton_images/gingembre-en-poudre.jpg",
    "/home/jack/Downloads/marmiton_images/gingembre-confit.jpg",
    "/home/jack/Downloads/marmiton_images/gelee-d-abricot.jpg",
    "/home/jack/Downloads/marmiton_images/galanga.jpg",
    "/home/jack/Downloads/marmiton_images/fructose.jpg",
    "/home/jack/Downloads/marmiton_images/fromage-rape.jpg",
    "/home/jack/Downloads/marmiton_images/fromage-grana-padano.jpg",
    "/home/jack/Downloads/marmiton_images/fromage-blanc.jpg",
    "/home/jack/Downloads/marmiton_images/fromage-ail-et-fines-herbes.jpg",
    "/home/jack/Downloads/marmiton_images/fregola-sarda.jpg",
    "/home/jack/Downloads/marmiton_images/foie-de-volaille.jpg",
    "/home/jack/Downloads/marmiton_images/flocons-de-bonite.jpg",
    "/home/jack/Downloads/marmiton_images/fleurs-de-bourache.jpg",
    "/home/jack/Downloads/marmiton_images/fines-herbes.jpg",
    "/home/jack/Downloads/marmiton_images/figue-de-barbarie.jpg",
    "/home/jack/Downloads/marmiton_images/figue.jpg",
    "/home/jack/Downloads/marmiton_images/feve-de-tonka.jpg",
    "/home/jack/Downloads/marmiton_images/feuilles-de-coriandre.jpg",
    "/home/jack/Downloads/marmiton_images/feuille-de-won-ton.jpg",
    "/home/jack/Downloads/marmiton_images/feuille-de-citronnier.jpg",
    "/home/jack/Downloads/marmiton_images/farine-de-mais.jpg",
    "/home/jack/Downloads/marmiton_images/extrait-de-vanille.jpg",
    "/home/jack/Downloads/marmiton_images/extrait-d-amande.jpg",
    "/home/jack/Downloads/marmiton_images/estragon.jpg",
    "/home/jack/Downloads/marmiton_images/essence-d-amande-amere.jpg",
    "/home/jack/Downloads/marmiton_images/escalope-de-poulet.jpg",
    "/home/jack/Downloads/marmiton_images/escalope-de-porc.jpg",
    "/home/jack/Downloads/marmiton_images/escalope-de-dinde.jpg",
    "/home/jack/Downloads/marmiton_images/epices-tandoori.jpg",
    "/home/jack/Downloads/marmiton_images/epices-pour-poisson.jpg",
    "/home/jack/Downloads/marmiton_images/endive-carmine.jpg",
    "/home/jack/Downloads/marmiton_images/eau-de-rose.jpg",
    "/home/jack/Downloads/marmiton_images/cuisse-de-grenouille.jpg",
    "/home/jack/Downloads/marmiton_images/crottin-de-chevre.jpg",
    "/home/jack/Downloads/marmiton_images/crepe-dentelle.jpg",
    "/home/jack/Downloads/marmiton_images/creme-fraiche-allegee.jpg",
    "/home/jack/Downloads/marmiton_images/courge-spaghetti.jpg",
    "/home/jack/Downloads/marmiton_images/coulis-de-cerise.jpg",
    "/home/jack/Downloads/marmiton_images/coulis-d-abricot.jpg",
    "/home/jack/Downloads/marmiton_images/cotelette-d-agneau.jpg",
    "/home/jack/Downloads/marmiton_images/cote-de-boeuf.jpg",
    "/home/jack/Downloads/marmiton_images/coppa.jpg",
    "/home/jack/Downloads/marmiton_images/confiture-de-prune.jpg",
    "/home/jack/Downloads/marmiton_images/confiture-de-poire.jpg",
    "/home/jack/Downloads/marmiton_images/confiture-de-cassis.jpg",
    "/home/jack/Downloads/marmiton_images/combava.jpg",
    "/home/jack/Downloads/marmiton_images/coing.jpg",
    "/home/jack/Downloads/marmiton_images/chocolat-patissier.jpg",
    "/home/jack/Downloads/marmiton_images/chocolat-noir.jpg",
    "/home/jack/Downloads/marmiton_images/chocolat.jpg",
    "/home/jack/Downloads/marmiton_images/chapon.jpg",
    "/home/jack/Downloads/marmiton_images/champignon-frais.jpg",
    "/home/jack/Downloads/marmiton_images/cerneau-de-noix.jpg",
    "/home/jack/Downloads/marmiton_images/cassoulet.jpg",
    "/home/jack/Downloads/marmiton_images/cassonade.jpg",
    "/home/jack/Downloads/marmiton_images/capres.jpg",
    "/home/jack/Downloads/marmiton_images/cafe-en-poudre.jpg",
    "/home/jack/Downloads/marmiton_images/branche-de-sapin.jpg",
    "/home/jack/Downloads/marmiton_images/bourgogne.jpg",
    "/home/jack/Downloads/marmiton_images/bocconcini.jpg",
    "/home/jack/Downloads/marmiton_images/badiane.jpg",
]

# Retry downloading the images
for i in failed_images:
    imageUrl = all_ingredients[i.split("/")[-1].split(".")[0]]["image"]

    try:
        response = requests.get(imageUrl)
        response.raise_for_status()
        with open(f"marmiton_images/{key}.jpg", "wb") as out_file:
            out_file.write(response.content)
    except requests.exceptions.HTTPError as e:
        print(all_ingredients[key]["image"], e)
        continue
