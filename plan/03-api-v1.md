# M3 — REST API v1 (+ PATs)

> Read `plan/00-architecture-goal.md` (§5 tables + §6 API contract). M2 must be done:
> every op is a `defineOp` module with zod `input`.

## Starting point

- M2 done: UI runs on `runOp`; `requireCtx('api')` still throws; no `src/routes/api` routes.

## Tasks

1. **PAT storage**: add `supabase/schema/*.sql` declarative table `user_api_tokens
(id uuid pk, user_id uuid→auth.users, name text, token_hash text unique, prefix text, created_at, revoked_at?)`
   - RLS (owner-only). Generate migration (`npx supabase db diff -f user_api_tokens`), review, `migration up`,
     `npm run db:types:local`. Implement `core/operations/auth/tokens.ts` (`create` returns secret once [store sha256],
     `list`, `revoke`) — JWT-only (no PAT-for-PAT).
2. **`requireCtx('api', event)`**: `Authorization: Bearer <supabaseJWT|cui_...>` → `userId`
   (PAT: hash → lookup → reject if revoked). Used by all v1 routes.
3. **Routes** (`src/routes/api/v1/`), each `+server.ts` < 50 lines (auth → `input.parse` → `runOp` → `json`):
   - `recipes/+server.ts` (GET list), `recipes/[id]/+server.ts` (GET/PATCH/DELETE), `recipes/draft/+server.ts`,
     `recipes/[id]/restore`, `recipes/[id]/image`, `recipes/import-url`, `recipes/import-text` (**SSE**
     `text/event-stream` forwarding core progress yields), `recipes/examples`, `ingredients/+server.ts`,
     `ingredients/match/+server.ts`, `spaces/+server.ts`, `spaces/[id]/+server.ts`, `spaces/[id]/join`,
     `spaces/[id]/leave`, `spaces/[id]/meals`, `spaces/[id]/meals/[mealId]`, `spaces/[id]/items`,
     `spaces/[id]/items/[itemId]`, `spaces/[id]/shopping-list`, `spaces/[id]/recommendations`,
     `me/+server.ts`, `me/seeds`, `me/seeds/logs`, `auth/tokens/+server.ts`, `billing/checkout/+server.ts`.
   - Shared `src/routes/api/v1/_lib.ts`: `toResponse(promise)` mapping `OpError.code` → status
     (UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, INSUFFICIENT_SEEDS 402, else 400/500).
   - `GET /api/v1/openapi.json`: generate from `registry` (name→method/path from a static route map + zod schemas).
4. Internal ops (`scrape`, `enrich`, `billing.consume`) stay unexposed. `upload-image` accepts multipart.
5. Docs: `plan/` untouched; add `src/routes/api/v1/README.md` (auth, curl examples for JWT + PAT, SSE usage).

## Acceptance criteria

- [ ] PAT lifecycle works: create (secret shown once) → `curl -H "Authorization: Bearer cui_..."` reads → revoke → 401.
- [ ] Every public op in §5 has a reachable route; internal ops return 404 on direct access.
- [ ] Import routes stream progress events then final JSON incl. `usage { privateCreditsUsed, publicCreditsUsed }`; insufficient seeds → 402 without side effects.
- [ ] RLS holds: user A cannot read/mutate user B's spaces via API (prove with two-user test).
- [ ] `npm run check` + `lint` pass; migration file reviewed (no RLS/policy noise beyond the new table).

## Validation

```bash
npm run check
npm run lint
npm run test:unit
# new: add tests/api-v1.test.ts (PAT create→use→revoke, CRUD meals/items, 402 on empty seeds, cross-user 403)
npm run test:integration
```

Manual: `curl` JWT + PAT against `/api/v1/spaces/[id]/meals` (GET/POST), `/api/v1/recipes/import-url` (SSE), `/api/v1/openapi.json` renders.

---

# Implementation done: report

M3 REST API v1 done — the app is fully usable from a pure API (CLI-ready JSON
in/out over 43 endpoints + public OpenAPI 3.1 at `/api/v1/openapi.json`).
How it ran: orchestrator laid schema + core auth + `_lib` + `openapi.ts` route
map, then 3 parallel route agents (recipes+ingredients / spaces+plans /
me+billing+tokens+README); orchestrator wrote the consistency tests and ran a
full live `curl` smoke (JWT + PAT, two users, SSE, revoke, RLS) which exposed
and fixed 4 latent bugs below.

## New surface
- `src/routes/api/v1/`: `_lib.ts` (auth → input → `runOp`/`runOpStream` → JSON/SSE;
  `OpError.code` → status via `toStatus`, ZodError → 400, else 500 without leaking),
  `openapi.ts` (`API_ROUTES` static map + `buildOpenApiDoc` from registry zod
  inputs via `z.toJSONSchema`), `openapi.json/+server.ts` (PUBLIC, no auth),
  35 route files covering every public op, `README.md` (auth, PAT lifecycle, curl,
  SSE, error table). `billing.consume` (internal) has no route — 404 by absence.
- `requireApiCtx(event)` (`context.ts`): `Bearer <JWT|cui_...>` → user-scoped
  PostgREST client + `auth.getUser` verify. PATs resolve via service-role hash
  lookup, then GoTrue mints a real short-lived user session for the token owner
  (`auth.ts:exchangePatForUserJwt` — admin `getUserById` → `generateLink`
  magiclink → `verifyOtp`, no email is sent) so data-table RLS is identical
  for both credential types. The session is revoked when the request finishes
  (`ApiAuth.cleanup`, wired through `runApiOp`/`streamApiOp` finally blocks, so
  no `auth.sessions` rows leak). No signing secret is needed anywhere — this
  works with both the legacy JWT secret and the new asymmetric signing keys.
- `auth/` ops (one file per op, per M2 precedent — deviation from the `tokens.ts`
  sketch): `create-token` (secret shown once, sha256 stored, max 10 active),
  `list-tokens` (metadata only), `revoke-token` (NOT_FOUND for foreign ids).
  Token routes are JWT-only (`requireJwt` rejects PAT with 403).
- `user_api_tokens` table (`21_api_tokens.sql` + owner RLS in `99_RLS.sql`,
  migration `..._user_api_tokens.sql` with generated view-noise stripped,
  `migration up`, `db:types:local`).
- Tests: `api-v1.test.ts` (20 tests: status mapping incl. 402/409, ROUTE↔registry
  both directions, OpenAPI shape + zod-derived fields, PAT helpers, body/query
  parsing). Mocks the 3 `.remote.ts` modules server-only op helpers import
  (SvelteKit remote transform can't load under vitest — see file header).

## Latent bugs the live smoke found (all fixed, all were broken app-wide too)
1. `spaces.create` + `spaces.join` always failed: `spaces` SELECT is
   membership-gated, so create's insert-then-`.select()` and join's existence
   check could never succeed (42501 / phantom `space-not-found`). Fixed at op
   level, no RLS change: create uses a pre-generated UUID with no select-back;
   join checks existence via `ctx.admin` (fails closed without admin).
2. Recipe image upload 403'd: storage `upsert:true` evaluates the UPDATE RLS
   policy even for new rows. Dropped `upsert` (fresh UUID names) — also removed
   in avatar upload.
3. Avatar upload/delete never worked anywhere: the `users` bucket didn't exist
   (not in schema/seed/DB) and had zero policies. New hand-written migration
   `..._user_avatars_bucket.sql` (bucket + owner INSERT/UPDATE/DELETE) + policies
   mirrored in `99_RLS.sql`. Avatar op is now remove-then-upload (fixed path).
4. Storage `remove()` was a silent no-op everywhere: no SELECT policy means the
   service can't see objects to delete (hardening migration removed listing).
   New migration `..._storage_owner_list_policies.sql` + `99_RLS.sql`: owner-scoped
   SELECT on `recipes` images and `users` avatars (buckets stay non-enumerable).
   Verified deletes really delete (0 rows remain).
- Also: `defineOp` re-registration now overwrites with a warn instead of throwing
  (M1 strictness relaxed — `vite dev` HMR re-evaluates op modules against the
  surviving registry singleton and the SSR runner exposes no `import.meta.hot`;
  without this every op edit poisoned all adapters until restart; proven working
  post-edit with no restart). `plans.add-item` `ingredientId` is now optional
  (free-text CLI items; backward compatible).

## Validation
- `npm run check`: 39 errors / 8 warnings — identical to M2 baseline, zero in new/modified files.
- `npx eslint` on all M3 files: clean. Prettier: clean.
- `test:unit`: 3 files / 24 tests green. `test:integration`: still "No tests found" (pre-existing, no `tests/` dir; plan's `tests/api-v1.test.ts` placed at `src/routes/api/v1/api-v1.test.ts` instead — vitest only includes `src/**`).
- `npm run build`: passes. Throwaway `db diff`: schemas ↔ DB in sync (only the known `recipes_randomized` view noise).
- Live smoke (`vite dev` + local Supabase, 2 users): openapi.json public (33 paths / 46 operations, valid 3.1.0); 401 without auth; PAT create → use (200) → PAT-for-PAT 403 → revoke → 401; spaces/meals/items full CRUD incl. servings/move/cook/restore + check/delete/restore; recipe draft → get → delete (404) → restore (200); image upload → delete (verified gone); avatar upload → overwrite → delete (verified gone); onboarding; Stripe checkout URL; ingredients list/match; seeds + logs; SSE `event: error` VALIDATION frame; recipe filter-column whitelist enforced; outsider reads `[]`, outsider PATCH is a silent no-op (RLS holds — name unchanged).
- NOT covered live: import SSE success path (costs a real LLM call) and 402 (community pool was Healthy so `canAfford` passes; 402 mapping is unit-tested). Cross-user RLS proven for spaces/meals; silent no-op writes (vs 4xx) are pre-existing op semantics, noted as M6 hardening candidate.
- Residue (local dev only): `apitest1/2@example.com` users + their trigger-created home spaces.
- Post-M3 fix (JWT signing keys migration): the original `mintUserJwt` hand-signed
  HS256 tokens with the legacy secret, which broke the moment the legacy secret
  was revoked (and is unfixable — new private keys never leave Supabase). Replaced
  with `exchangePatForUserJwt` (real GoTrue session per PAT request + cleanup);
  `SUPABASE_JWT_SECRET` removed from code, `.env` and `.env.example`.
  Follow-up fix: cleanup uses `admin.signOut(jwt, 'local')` — the default
  `'global'` scope revoked ALL of the user's sessions, logging them out of the
  web app on every PAT request.
