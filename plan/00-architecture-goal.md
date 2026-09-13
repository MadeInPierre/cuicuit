# Operations Architecture — Goal (shared reference for all milestones)

> All milestones (`plan/01…06`) implement this document. Agents: read this file first,
> then your milestone file. If a conflict arises, this file wins — flag it, don't improvise.

## 1. Goal

Every database-touching operation in Cuicuit is defined **once** as a `defineOp` module
(one file per operation), with **thin transport adapters** exposing it to each source:

| Source                     | Adapter location             | Status after project                  |
| -------------------------- | ---------------------------- | ------------------------------------- |
| In-app direct (current UI) | `*.remote.ts` + `core` reads | kept, thinned to `ops.run(...)` calls |
| PowerSync (offline)        | `src/lib/sync/`              | added (M5), incremental               |
| REST API                   | `src/routes/api/v1/...`      | added (M3)                            |
| MCP (Streamable HTTP)      | `src/routes/mcp/+server.ts`  | added (M4)                            |

Locked decisions: **JWT + PATs** for API/MCP auth · **remotes stay as thin adapters** ·
**PowerSync phase 1 = recipes/ingredients offline read + `space_meals`/`space_items` offline read/write**
(full offline later; scrape/LLM/billing stay online-only) · **MCP = Streamable HTTP**.

## 2. Non-goals

- No new product features. M2 migrates behavior 1:1.
- No prod DB writes by agents (`AGENTS.md`: declarative schema in `supabase/schema/*.sql`,
  `npx supabase db diff -f`, review migration, `migration up` locally, `db:types:local`).
- Pantry / cookbooks / chat are placeholders (no DB ops) → out of scope until they get tables.

## 3. Target tree

```
src/lib/core/operations/            ← single source of truth
  registry.ts                       ← defineOp() + op() runner + metadata types (M1)
  context.ts                        ← OpCtx builder: { supabase, admin?, userId, source } (M1)
  auth.ts                           ← requireUserId(), PAT resolver (M1 stub, M3 real)
  credits.ts                        ← withCredits() gate (M1 stub, M2 real move)
  errors.ts                         ← OpError { code, message, details? } (M1)
  recipes/
    list.ts                         ← ex get-recipe-detailed.ts:getRecipesDetailed
    get.ts                          ← ex :getRecipeDetailed
    create-draft.ts                 ← ex create-draft-recipe.remote.ts body
    edit.ts                         ← NEW extraction from edit/+page.svelte onSubmit
    delete.ts                       ← ex delete-recipe.ts (delete+restore via flag)
    upload-image.ts                 ← ex upload-recipe-image.ts:uploadRecipeImage
    delete-image.ts                 ← ex :deleteRecipeImage
    import-from-url.ts              ← ex import-recipe.ts:importRecipeFromUrlCore
    import-from-text.ts             ← ex :importRecipeFromTextCore
    add-examples.ts                 ← ex add-example-recipes.remote.ts body
  plans/
    list-meals.ts                   ← ex get-plan-meals.ts
    list-items.ts                   ← ex get-plan-items.ts
    shopping-list.ts                ← PURE helper moved from routes/(app)/shopping-list/generate-shopping-list.ts
    add-recipe.ts                   ← ex add-recipe-to-plan.ts (no toast/goto/refresh)
    update-servings.ts              ← ex update-meal.ts:updateMealServings
    move-meal.ts                    ← ex :updateMealPosition
    delete-meal.ts                  ← ex :deleteMeal ({ undo, cooked } flags)
    check-item.ts                   ← ex update-item.ts:updatePlanItemChecked (+undo)
    delete-item.ts                  ← ex :updatePlanItemDeleted (+undo)
    add-item.ts                     ← ex add-shopping-item.ts
    recommendations.ts              ← ex get-shopping-recommendations.ts (RPC read)
  spaces/
    list.ts                         ← ex get-user-spaces-with-members.ts
    create.ts                       ← ex create-space.ts
    edit.ts                         ← ex edit-space.ts
    join.ts                         ← ex join-space.ts
    leave.ts                        ← ex leave-space.ts
  profile/
    get.ts                          ← ex get-user-public-profile(s).ts + get-user-preferences.ts + get-user-permissions.ts (3 reads, 1 module or 3 files — agent picks 3 files if long)
    update-profile.ts               ← ex update-user-profile.ts
    update-preferences.ts           ← ex update-user-preferences.ts
    update-aisle-order.ts           ← ex update-aisle-order.ts
    update-avatar.ts                ← ex update-user-avatar.ts
    upload-picture.ts               ← ex upload-profile-picture.ts
    delete-picture.ts               ← ex delete-user-picture.ts
  billing/
    balance.ts                      ← ex get-user-credit-balance.ts (read-only)
    logs.ts                         ← ex get-user-credit-logs.ts (read-only)
    consume.ts                      ← ex consume-credits.remote.ts body (internal, service_role)
    checkout.ts                     ← ex create-stripe-checkout-session.remote.ts body (internal)
  ingredients/
    match.ts                        ← ex parse-ingredients/match.ts+process.ts (RPC)
    list.ts                         ← ex admin/ingredients/+page.svelte fetchIngredients
  auth/
    tokens.ts                       ← NEW PAT create/list/revoke (needs user_api_tokens table, M3)

src/lib/sync/ (M5)                  ← schema.ts, connector.ts, mutations.ts
src/routes/api/v1/... (M3)
src/routes/mcp/+server.ts (M4)
```

**One operation = one file.** If a file exceeds ~200 lines, split helpers into `./<op>-helpers.ts`
next to it — never merge two ops into one file.

## 4. The `defineOp` contract (exact shape, M1 freezes it)

```ts
// src/lib/core/operations/registry.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/shared/db/supabase.types';
import type { z } from 'zod';

export type OpSource = 'app' | 'api' | 'mcp' | 'sync';
export interface OpCtx {
	supabase: SupabaseClient<Database>; // user-JWT client (RLS enforced)
	admin?: SupabaseClient<Database>; // service_role, server-only ops
	userId: string;
	source: OpSource;
	signal?: AbortSignal;
}
export type OpKind = 'read' | 'write' | 'rpc' | 'storage';
export type OpSync = 'synced' | 'server-only' | 'later'; // 'later' = deferred past M5

export interface OpDef<TIn, TOut> {
	name: string; // e.g. 'plans.add-recipe' — unique, used by API/MCP/sync
	domain: string; // 'recipes' | 'plans' | ...
	kind: OpKind;
	sync: OpSync;
	credits?: { feature: string; seeds: number }; // set ONLY on import-from-url/text
	input: z.ZodType<TIn>;
	handler: (ctx: OpCtx, input: TIn) => Promise<TOut> | AsyncGenerator<unknown, TOut>;
	internal?: boolean; // true → hidden from API/MCP (scrape, enrich, consume)
}

export function defineOp<TIn, TOut>(def: OpDef<TIn, TOut>): OpDef<TIn, TOut>;
export const registry: Map<string, OpDef<unknown, unknown>>; // auto-registered
export async function runOp<TIn, TOut>(name: string, ctx: OpCtx, input: TIn): Promise<TOut>;
```

Rules:

1. **No UI in core**: no `toast`, `goto`, Svelte `$state`, component imports. Pure async data fns.
2. **No transport in core**: no `getRequestEvent`, no `Response`/`json`, no MCP types.
3. **Credits only via `withCredits()`** in `credits.ts`, applied inside the two import ops —
   adapters never call `consumeCredits` directly (M2 moves the existing logic verbatim).
4. **Auth**: handler assumes `ctx.userId` is verified. `auth.ts:requireCtx()` builds ctx from
   `event.locals` (app/remote) or JWT/PAT (API/MCP). RLS via `ctx.supabase`; `ctx.admin`
   only in `server-only` ops (imports, consume, cache writes).
5. **Validation**: zod `input` schema per op (reuse `supazod.schemas.ts` row types). Adapters
   validate at the boundary with the same schema; errors are `OpError`.

## 5. Full operation catalog → mapping per source

`Expose` = thin adapter exists. `internal` = core-only (called by other ops, not exposed).

### 5.1 Recipes

| #   | Op name / core file                                        | kind / sync / credits            | Remote (thin)                           | API v1                                     | MCP                                       | Sync M5                                  |
| --- | ---------------------------------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------------------ | ----------------------------------------- | ---------------------------------------- |
| R1  | `recipes.list` / `recipes/list.ts`                         | read / **synced**                | callers use core directly               | `GET /recipes`                             | `recipes_list`                            | offline read                             |
| R2  | `recipes.get` / `recipes/get.ts`                           | read / **synced**                | same                                    | `GET /recipes/[id]`                        | `recipes_get`                             | offline read                             |
| R3  | `recipes.create-draft` / `recipes/create-draft.ts`         | write / synced                   | `createDraftRecipe` → runOp             | `POST /recipes/draft`                      | `recipes_create_draft`                    | local-first write                        |
| R4  | `recipes.edit` / `recipes/edit.ts`                         | write / synced                   | NEW thin `edit-recipe.remote.ts`        | `PATCH /recipes/[id]`                      | `recipes_edit`                            | local-first write                        |
| R5  | `recipes.delete` / `recipes/delete.ts`                     | write / synced                   | thin remote                             | `DELETE /recipes/[id]`, `POST .../restore` | `recipes_delete`                          | local-first (soft-delete flag)           |
| R6  | `recipes.upload-image` / `recipes/upload-image.ts`         | storage / synced(col)            | thin                                    | `POST /recipes/[id]/image` (multipart)     | `recipes_upload_image` (returns URL flow) | sync `image_ids` col only                |
| R7  | `recipes.delete-image` / `recipes/delete-image.ts`         | storage / synced(col)            | thin                                    | `DELETE /recipes/[id]/image`               | — (fold into upload tool notes)           | same                                     |
| R8  | `recipes.import-from-url` / `recipes/import-from-url.ts`   | write / **server-only** / 1 seed | `importRecipeFromUrl` → `yield* runOp`  | `POST /recipes/import-url` (SSE)           | `recipes_import_url`                      | never (queue intent offline, run online) |
| R9  | `recipes.import-from-text` / `recipes/import-from-text.ts` | write / **server-only** / 1 seed | `importRecipeFromText` → `yield* runOp` | `POST /recipes/import-text` (SSE)          | `recipes_import_text`                     | never                                    |
| R10 | `recipes.add-examples` / `recipes/add-examples.ts`         | write / server-only, no charge   | thin `command`                          | `POST /recipes/examples`                   | `recipes_add_examples`                    | never                                    |
| —   | scrape / enrich / import-cache / processAndMatch           | internal helpers                 | keep thin, `internal: true`             | —                                          | —                                         | never                                    |

### 5.2 Plans (PowerSync flagship)

| #   | Op / file                                                       | kind / sync        | Remote          | API                                              | MCP                         | Sync M5                       |
| --- | --------------------------------------------------------------- | ------------------ | --------------- | ------------------------------------------------ | --------------------------- | ----------------------------- |
| P1  | `plans.list-meals` / `plans/list-meals.ts`                      | read / **synced**  | direct core     | `GET /spaces/[id]/meals`                         | `plan_list`                 | offline read                  |
| P2  | `plans.list-items` / `plans/list-items.ts`                      | read / **synced**  | direct core     | `GET /spaces/[id]/items`                         | `shopping_list`             | offline read                  |
| P3  | `shopping-list` pure / `plans/shopping-list.ts`                 | pure / n/a         | —               | derived in `GET .../shopping-list`               | folded into `shopping_list` | runs locally on synced rows   |
| P4  | `plans.add-recipe` / `plans/add-recipe.ts`                      | write / **synced** | NEW thin remote | `POST /spaces/[id]/meals`                        | `plan_add_recipe`           | local-first (meal+items txn)  |
| P5  | `plans.update-servings` / `plans/update-servings.ts`            | write / synced     | thin remote     | `PATCH /spaces/[id]/meals/[m]`                   | `plan_update`               | local-first                   |
| P6  | `plans.move-meal` / `plans/move-meal.ts`                        | write / synced     | thin remote     | same                                             | `plan_move`                 | local-first (LWW `position`)  |
| P7  | `plans.delete-meal` / `plans/delete-meal.ts` (`{undo, cooked}`) | write / synced     | thin remote     | `DELETE ...` + `POST .../restore`, `cooked` flag | `plan_cooked`               | local-first (soft flags)      |
| P8  | `plans.check-item` / `plans/check-item.ts`                      | write / synced     | thin remote     | `PATCH /spaces/[id]/items/[i]`                   | `shopping_check`            | local-first                   |
| P9  | `plans.delete-item` / `plans/delete-item.ts`                    | write / synced     | thin remote     | `DELETE ...` + restore                           | `shopping_delete`           | local-first                   |
| P10 | `plans.add-item` / `plans/add-item.ts`                          | write / synced     | thin remote     | `POST /spaces/[id]/items`                        | `shopping_add`              | local-first                   |
| P11 | `plans.recommendations` / `plans/recommendations.ts`            | rpc / server-only  | thin query      | `GET /spaces/[id]/recommendations`               | `shopping_recommend`        | online RPC, cache last result |

### 5.3 Spaces · Profile · Billing · Ingredients · Auth

| Op / file                                                                                                                                 | kind / sync                                                | Remote                   | API                                       | MCP                         | Sync                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------ | ----------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `spaces.list/create/edit/join/leave` / `spaces/<op>.ts` (5 files)                                                                         | read/write / **later** (M5 designs publication, M6+ syncs) | keep, thinned            | `/api/v1/spaces*`                         | `spaces_*` (5 tools)        | phase 1: direct; publication by `space_members.user_id` prepared now |
| `profile.get/update-profile/update-preferences/update-aisle-order/update-avatar/upload-picture/delete-picture` / `profile/*.ts` (7 files) | read/write/storage / **later**                             | keep, thinned            | `/api/v1/me*`                             | `profile_*`                 | later (`user_*` by `user_id`, trivial)                               |
| `billing.balance/logs` / `billing/balance.ts`, `logs.ts`                                                                                  | read / never (ledger)                                      | direct core              | `GET /me/seeds`, `GET /me/seeds/logs`     | `seeds_balance` (read-only) | never; cached client-side                                            |
| `billing.consume` / `billing/consume.ts`                                                                                                  | rpc / server-only, **internal**                            | — (called by imports)    | —                                         | — (only via paid ops)       | never                                                                |
| `billing.checkout` / `billing/checkout.ts`                                                                                                | api-call / server-only                                     | thin query               | `POST /billing/checkout`                  | — (URL flow, link only)     | never                                                                |
| `ingredients.match` / `ingredients/match.ts`                                                                                              | rpc / server-only w/ local fallback                        | thin query               | `POST /ingredients/match`                 | `ingredients_match`         | read tables synced; RPC online fallback                              |
| `ingredients.list` / `ingredients/list.ts`                                                                                                | read / synced                                              | direct core (admin page) | `GET /ingredients`                        | —                           | offline read                                                         |
| `auth.tokens` / `auth/tokens.ts` (NEW, M3)                                                                                                | write / never                                              | —                        | `GET/POST/DELETE /auth/tokens` (JWT-only) | —                           | never                                                                |

## 6. Adapter contracts (frozen shapes)

- **Remote**: `export const x = query(inputSchema, async (input) => runOp('name', await requireCtx('app'), input))`.
  Streaming ops use `query.live` + `yield*` over the core generator.
- **API**: `+server.ts` → `requireCtx('api', event)` (JWT-or-PAT) → `inputSchema.parse(await request.json())` → `runOp` → `Response.json`. Streaming → `text/event-stream`. Errors: `OpError.code` → status (`UNAUTHENTICATED`→401, `FORBIDDEN`→403, `NOT_FOUND`→404, `INSUFFICIENT_SEEDS`→402, else 400/500).
- **MCP**: single `src/routes/mcp/+server.ts` Streamable-HTTP; tool list auto-derived from
  `registry` where `!internal`; same `requireCtx('mcp')` + same zod schemas.
- **Sync**: `src/lib/sync/schema.ts` declares synced tables; `mutations.ts` maps local writes to
  `runOp` names for replay; server-only ops are never enqueued as row writes.

## 7. Conventions all milestones follow

- KISS/YAGNI, no duplication, Tailwind (no raw CSS) for any new UI, TypeScript strict.
- DB changes: declarative `supabase/schema/*.sql` → `npx supabase db diff -f <name>` → review →
  `migration up` local → `npm run db:types:local`. Never `db push` (user does prod).
- `npm run check` (svelte-check) + `npm run lint` must pass at each milestone gate.
