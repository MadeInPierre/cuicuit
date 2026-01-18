from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from urllib.request import urlopen
from recipe_scrapers import scrape_html

app = FastAPI()


# Allow specific origins to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)


class RecipeRequest(BaseModel):
    url: str


@app.post("/scrape-recipe/")
async def scrape_recipe(request: RecipeRequest):
    try:
        # Retrieve HTML from the given URL
        html = urlopen(request.url).read().decode("utf-8")
        scraper = scrape_html(html, org_url=request.url)

        # Scrape recipe information
        scrape = scraper.to_json()

        # Transform the scraped data into the desired format
        result = {
            "source": {
                "name": scrape.get("site_name", ""),
                "domain": scrape.get("host", ""),
                "url": scrape.get("canonical_url", ""),
            },
            "title": scrape.get("title", ""),
            "description": scrape.get("description", ""),
            "image": scrape.get("image", ""),
            "author": scrape.get("author", ""),
            "servings": scrape.get("yields", ""),
            "ingredients": scrape.get(
                "ingredient_groups", [{"ingredients": scrape.get("ingredients", []), "purpose": None}]
            ),
            "instructions": scrape.get("instructions_list", scrape.get("instructions", "").split("\n")),
            "time": {
                "prep": scrape.get("prep_time"),
                "cook": scrape.get("cook_time"),
                "rest": scrape.get("rest_time"),
                "total": scrape.get("total_time"),
            },
            "ratings": scrape.get("ratings", ""),
            "category": scrape.get("category", ""),
            "language": scrape.get("language", ""),
        }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
