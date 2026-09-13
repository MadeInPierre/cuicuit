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
2. **`requireCtx('api', event)`**: `Authorization: Bearer <supabaseJWT|pat_...>` → `userId`
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

- [ ] PAT lifecycle works: create (secret shown once) → `curl -H "Authorization: Bearer pat_..."` reads → revoke → 401.
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
