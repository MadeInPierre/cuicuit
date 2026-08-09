This is a Python REST server that takes a recipe URL and returns the parsed recipe in JSON format. It is **one strategy** in Cuicuit's multi-strategy scraping pipeline: it runs in a Docker container on a VPS alongside the frontend and is called by the SvelteKit orchestrator at `POST /scrape-recipe`. The service is fully optional — if it's down or unset, the orchestrator falls through to the SaaS providers.

## Endpoints

- `GET /health` — liveness probe.
- `POST /scrape-recipe` — body `{ "url": "https://..." }` → parsed recipe JSON (raw passthrough, enriched downstream by the LLM). Returns `422` when no recipe can be parsed, `502/504` on fetch failures.

## Local development

Build the image with: 

```bash
cd scraper/
docker build -t madeinpierre/cuicuit-scraper .
```

Run with:

```bash
docker run -d -p 8000:8000 madeinpierre/cuicuit-scraper
```

Login to docker Hub with:

```bash
docker login
```

Push the image to docker Hub with:

```bash
docker push madeinpierre/cuicuit-scraper
```

## Versioned tags

```bash
# Tag a version for traceability (example: v0.1.0)
docker tag madeinpierre/cuicuit-scraper:latest madeinpierre/cuicuit-scraper:v0.1.0

# Push both tags
docker push madeinpierre/cuicuit-scraper:latest
docker push madeinpierre/cuicuit-scraper:v0.1.0
```

## Multi-arch (x86 + Raspberry Pi)

If you need images for both x86 (amd64) and Raspberry Pi (arm64/armv7), build and push a multi-arch manifest.

### One-time Buildx setup

```bash
# Enable QEMU emulators (needed to cross-build arm)
docker run --privileged --rm tonistiigi/binfmt --install all

# Create and use a Buildx builder
docker buildx create --use --name multiarch
docker buildx inspect --bootstrap
```

### Build and push multi-arch images

```bash
# Build and push for amd64, arm64, and arm/v7 with two tags
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t madeinpierre/cuicuit-scraper:latest \
  -t madeinpierre/cuicuit-scraper:v0.1.0 \
  --push .
```

Notes:
- The Dockerfile installs build-essential temporarily to compile any arm-specific wheels, then purges it.
- The manifest ensures Raspberry Pi pulls the correct arm variant automatically.
- To build natively on a Raspberry Pi, you can simply run `docker build -t madeinpierre/cuicuit-scraper:latest .` and push, but that produces an arm-only image.

### Run on Raspberry Pi

```bash
docker pull madeinpierre/cuicuit-scraper:latest
docker run -d --name cuicuit-scraper -p 8000:8000 madeinpierre/cuicuit-scraper:latest
```

### Logs

```bash
docker logs -f --tail 50 cuicuit-scraper
```

