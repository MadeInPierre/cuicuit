"""Cuicuit Recipe Scraper.

Thin HTTP wrapper around the `recipe-scrapers` package. This is ONE of the
strategies in the Cuicuit scraping pipeline (the free Python one); it is called
by the SvelteKit orchestrator at `POST /scrape-recipe`. The service is fully
optional — if it's down or unset, the orchestrator simply moves on to the next
strategy.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from recipe_scrapers import scrape_html

app = FastAPI(title="Cuicuit Recipe Scraper", version="2.0.0")

# The service is only ever called server-side by the SvelteKit backend, but we
# keep permissive CORS for local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecipeRequest(BaseModel):
    url: HttpUrl


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
}

TIMEOUT_SECONDS = 15


def fetch_html(url: str) -> str:
    session = requests.Session()
    session.headers.update(HEADERS)

    retry = Retry(total=2, status_forcelist=[429, 500, 502, 503, 504], backoff_factor=0.5)
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    try:
        response = session.get(url, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.text
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail={"error": "fetch_timeout", "message": "Timed out fetching the page."},
        ) from exc
    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 502
        raise HTTPException(
            status_code=502 if status >= 500 else status,
            detail={
                "error": "fetch_failed",
                "status": status,
                "message": "The site refused the request (likely bot protection).",
            },
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail={"error": "unreachable", "message": "Could not reach the page."},
        ) from exc


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "cuicuit-recipe-scraper"}


@app.post("/scrape-recipe")
async def scrape_recipe(request: RecipeRequest) -> dict:
    url = str(request.url)

    try:
        html = fetch_html(url)
        scraper = scrape_html(html, org_url=url)
        scrape = scraper.to_json()

        instructions = scrape.get("instructions_list")
        if not instructions:
            instructions = [
                step.strip()
                for step in scrape.get("instructions", "").split("\n")
                if step.strip()
            ]

        return {
            "strategy": "recipe-scrapers",
            "source": {
                "name": scrape.get("site_name", ""),
                "domain": scrape.get("host", ""),
                "url": scrape.get("canonical_url", url),
            },
            "title": scrape.get("title", ""),
            "description": scrape.get("description", ""),
            "image": scrape.get("image", ""),
            "author": scrape.get("author", ""),
            "servings": scrape.get("yields", ""),
            "ingredients": scrape.get(
                "ingredient_groups",
                [{"ingredients": scrape.get("ingredients", []), "purpose": None}],
            ),
            "instructions": instructions,
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
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "parse_failed", "message": "Could not parse a recipe from this page."},
        ) from exc
