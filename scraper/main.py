from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from recipe_scrapers import scrape_html

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecipeRequest(BaseModel):
    url: str


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


def fetch_html(url: str) -> str:
    session = requests.Session()
    session.headers.update(HEADERS)

    retry = Retry(
        total=2,
        status_forcelist=[403, 429, 500],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception:
        return fetch_html_browser(url)


def fetch_html_browser(url: str) -> str:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise HTTPException(
            status_code=502,
            detail="Blocked by site and Playwright not installed",
        )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=15000)
        html = page.content()
        browser.close()
        return html


@app.post("/scrape-recipe/")
async def scrape_recipe(request: RecipeRequest):
    try:
        html = fetch_html(request.url)
        scraper = scrape_html(html, org_url=request.url)
        scrape = scraper.to_json()

        instructions = scrape.get("instructions_list")
        if not instructions:
            instructions = [step.strip() for step in scrape.get("instructions", "").split("\n") if step.strip()]

        return {
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
