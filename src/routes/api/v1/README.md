# Cuicuit API v1

Base URL: `<origin>/api/v1`. Machine-readable spec: [`./openapi.json`](./openapi.json).

> New here? Start with [Beginner's guide](#beginners-guide) below. The
> [reference sections](#auth-reference) after it document every auth rule and endpoint.

## Beginner's guide

The API lets you do everything the web app does, from a terminal or script.
You only need `curl` and an account.

**Setup** — point these at your instance (local dev shown; for the hosted
version use its URL instead):

```bash
export BASE="http://localhost:5173/api/v1"   # the app (`npm run dev`)
export SUPABASE_URL="http://127.0.0.1:54321" # local Supabase (see `.env`: PUBLIC_SUPABASE_URL)
export ANON_KEY="<PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env>"  # public key, safe to use here
```

### 1. Create an account

Sign up in the web app, or with `curl`:

```bash
curl -X POST $SUPABASE_URL/auth/v1/signup \
  -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"pick-a-strong-password"}'
```

Then **confirm your email** (click the link in the mail). Running locally with
no mailer? Open Supabase Studio (usually http://127.0.0.1:54323) →
Authentication → your user → Confirm email. A personal "Home" space is created
for you automatically.

### 2. Sign in and get a token (JWT)

```bash
JWT=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"pick-a-strong-password"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
```

This short-lived JWT already calls every endpoint. But for daily use, trade it
for a **Personal Access Token (PAT)** that you can revoke anytime:

```bash
curl -X POST $BASE/auth/tokens -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' -d '{"name":"my-laptop"}'
# → {"id":"...","secret":"cui_..."}
```

**Copy the `secret` now — it is shown only once** and can't be recovered
(you can always create a new one). Then forget the JWT and use the PAT:

```bash
export TOKEN="cui_...paste-yours-here"
curl $BASE/me -H "Authorization: Bearer $TOKEN"
```

Token housekeeping (needs the JWT, PATs can't manage themselves):

```bash
curl $BASE/auth/tokens -H "Authorization: Bearer $JWT"        # list
curl -X DELETE $BASE/auth/tokens/<id> -H "Authorization: Bearer $JWT"  # revoke
```

### 3. Typical usage

```bash
# Who am I, and how many AI seeds do I have?
curl $BASE/me -H "Authorization: Bearer $TOKEN"
curl $BASE/me/seeds -H "Authorization: Bearer $TOKEN"

# List my spaces (your auto-created "Home" space is there)
curl $BASE/spaces -H "Authorization: Bearer $TOKEN"

# Create a space for a trip, saving its id for later
SPACE=$(curl -s -X POST $BASE/spaces -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Weekend Trip"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

# Find a recipe (languageId=1 is English, required on recipe endpoints)
curl "$BASE/recipes?languageId=1&searchText=pasta&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Plan a recipe (grab a recipe id from the search above)
curl -X POST $BASE/spaces/$SPACE/meals -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"recipeId":"<recipe-id>","date":"2026-09-20"}'

# Add a free-text item to the shopping list (no catalog match needed)
curl -X POST $BASE/spaces/$SPACE/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Olive oil"}'

# The combined shopping list for the space
curl "$BASE/spaces/$SPACE/shopping-list?languageId=1" \
  -H "Authorization: Bearer $TOKEN"
```

Import a recipe from a blog URL with AI (costs 1 seed, streams progress —
note the `-N` flag and the `event: error` failure frame):

```bash
curl -N -X POST $BASE/recipes/import-url -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"url":"https://example.com/recipe"}'
```

### 4. When something fails

Errors look like `{ "error": { "code": "...", "message": "..." } }`:

| Status | What it usually means                         | Fix                                         |
| ------ | --------------------------------------------- | ------------------------------------------- |
| 401    | Missing/bad/expired credential                | Sign in again; check the `Bearer` header    |
| 402    | Not enough seeds for an AI action             | Top up / wait for refill                    |
| 403    | PAT used on a JWT-only route (`/auth/tokens`) | Redo the call with the JWT                  |
| 404    | Wrong id, or someone else's private object    | Check the id; list your own objects first   |
| 400    | Body/query doesn't match the expected shape   | Compare with `./openapi.json` for the route |

Two gotchas: `userId`/`createdBy` are always taken from your credential, so
don't send them. And on SSE endpoints the HTTP status stays 200 even on
failure — your client must watch for the `event: error` frame.

---

## Auth (reference)

`Authorization: Bearer <supabaseJWT|cui_...>` on every endpoint except `GET /api/v1/openapi.json` (public).

- User JWT (from the web session) can call everything, including `POST /api/v1/auth/tokens`.
- Personal Access Tokens (`cui_...`) call everything except token management (`GET|POST /api/v1/auth/tokens`, `DELETE /api/v1/auth/tokens/{id}` are JWT-only).

PAT lifecycle:

```bash
# 1. Create a token (JWT only, secret shown once)
curl -X POST $BASE/auth/tokens -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' -d '{"name":"cli"}'
# → {"id":"...","secret":"cui_..."}

# 2. Use the PAT
curl $BASE/me -H "Authorization: Bearer cui_..."

# 3. Revoke (JWT only)
curl -X DELETE $BASE/auth/tokens/<id> -H "Authorization: Bearer $JWT"
```

## Examples (reference)

```bash
# List my spaces
curl $BASE/spaces -H "Authorization: Bearer $TOKEN"

# Create a space
curl -X POST $BASE/spaces -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Home"}'

# Add a recipe to the plan
curl -X POST $BASE/spaces/<spaceId>/meals -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"recipeId":"<id>","date":"2026-09-13"}'
```

SSE (recipe import from URL, costs 1 seed):

```bash
curl -N -X POST $BASE/recipes/import-url -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"url":"https://example.com/recipe"}'
```

Progress arrives as `data: <json>` frames, then the final result. Failures arrive as an `event: error` frame (HTTP status stays 200 — clients must watch for it).

## Errors

Envelope: `{ "error": { "code": "...", "message": "..." } }`.

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 401    | Missing/invalid credentials              |
| 402    | Insufficient seeds                       |
| 403    | Forbidden (e.g. PAT on a JWT-only route) |
| 404    | Not found                                |
| 400    | Invalid input                            |
| 500    | Unexpected server error                  |

Identity fields (`userId`, `createdBy`) are always derived from the credential — any client-supplied values are ignored.
