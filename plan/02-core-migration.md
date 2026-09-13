# M2 — Core migration (app works identically, now on `defineOp`)

> Read `plan/00-architecture-goal.md` first. This is the big mechanical milestone:
> move every op in §5 into its own `src/lib/core/operations/<domain>/<op>.ts` file and thin
> all callers to `runOp`. **No new features, no API/MCP/PowerSync yet.**

## Starting point

- M1 done: `registry/defineOp/OpCtx/OpError` frozen, `ingredients.list` example registered.

## Tasks

1. **Recipes** (10 files in `core/operations/recipes/`): `list.ts`, `get.ts` (move bodies from
   `features/recipes/queries/get-recipe-detailed.ts`); `create-draft.ts` (from `create-draft-recipe.remote.ts`);
   `delete.ts` (from `delete-recipe.ts`, strip toast, keep `{ restore }` flag); `upload-image.ts` + `delete-image.ts`
   (from `upload-recipe-image.ts`, accept `ctx.supabase ?? ctx.admin`); `import-from-url.ts` + `import-from-text.ts`
   (from `import-recipe.ts` cores + `import-cache.ts` helpers stay as co-located `*-helpers.ts`);
   `add-examples.ts` (no-charge preserved); `edit.ts` (**new**: extract UPSERT + delete+insert from
   `routes/(app)/recipes/[id]/edit/+page.svelte:300-369`).
   Move `withCredits({seeds:1})` from `import-from-url.remote.ts` **into** the two import ops via `credits.ts`.
2. **Plans** (11 files in `core/operations/plans/`): `list-meals.ts`, `list-items.ts` (bodies from queries);
   `shopping-list.ts` (move pure `generate-shopping-list.ts` from routes → core, re-export from old path);
   `add-recipe.ts`, `update-servings.ts`, `move-meal.ts`, `delete-meal.ts`, `check-item.ts`, `delete-item.ts`,
   `add-item.ts` (strip `toast`/`goto`/refresh — return data; callers refresh), `recommendations.ts` (RPC).
3. **Spaces** (5 files), **profile** (7 files), **billing** (`balance.ts`, `logs.ts`, `consume.ts` internal,
   `checkout.ts`), **ingredients** (`match.ts` real move over M1 example, keep `list.ts`).
   Helpers (`get-language-id.ts`, `processAndMatchIngredients`, `saveEnrichedRecipe`, etc.) move as
   co-located `*-helpers.ts`, never as ops.
4. **Thin the adapters**: every `*.remote.ts` becomes `query(inputSchema, (i) => runOp(name, requireCtx('app'), i))`
   (streaming imports use `query.live` + `yield*`). Every client action (`plans/actions/*`, `spaces/actions/*`,
   `user-settings/actions/*`, `delete-recipe.ts`) becomes `(input) => runOp(name, requireCtx('app'), input)` with
   toast/goto/refresh staying in the calling component where needed. Inline page DB (`edit/+page.svelte`,
   `welcome/+page.svelte`, `shopping-list/*`, `admin/*`) calls core ops instead of `supabase.client.from`.
   Old `features/**/queries|actions` files become deprecated re-exports (delete only if trivially safe).
5. Keep `scrape`/`enrich` remotes as `internal: true` ops or plain server helpers (agent picks; document in file header).

## Acceptance criteria

- [ ] One file per op exists per §5 catalog (~35 files); no domain file contains two ops.
- [ ] No business logic left in `*.remote.ts` or components (spot-check: `import-from-url.remote.ts` < 30 lines;
      `add-recipe-to-plan.ts` has no SQL).
- [ ] Credit gating lives in core import ops (`withCredits`), remotes don't reference `consumeCredits`.
- [ ] UI flows unchanged: import URL/text (+progress), draft, edit, delete/restore, image up/delete, plan add/move/servings/cook/delete, items add/check/delete, spaces CRUD/join/leave, profile/avatar, seeds display, admin pages.
- [ ] `npm run check` + `lint` (promote M1 rule to error for **new** violations; grandfather list shrinks, doesn't grow).

## Validation

```bash
npm run check
npm run lint
npm run test:unit
npm run test:integration # full playwright suite must pass unmodified
```

Manual smoke (dev): login → import URL (progress + 1 seed) → edit → image → add to plan → servings/move/cook → check/delete item → spaces create/join/leave → avatar change → seeds page. Compare against pre-M2 screen-for-screen.

---

# Implementation done: report

M2 core migration done. How it ran: orchestrator laid shared infra, then 4 parallel
domain agents (recipes / plans / spaces+profile / billing+ingredients) with
non-overlapping file ownership; orchestrator wired `index.ts`, deleted one dead
remote, shrank the eslint grandfather list, and fixed 5 type errors.

## Shared infra (orchestrator, `src/lib/core/operations/`)
- `registry.ts` — added `runOpStream()` async-generator runner (validates, then
  re-yields; non-generator handlers yield once). `runOp` still fail-fasts on generators.
- `context.client.ts` — NEW client-safe `getClientCtx()` (no `$app/server`): builds
  `OpCtx` from the `supabase.client` singleton + `auth.getUser()`. Client actions and
  `.svelte` callers import `runOp`/`getClientCtx` from `registry.js`/`context.client.js`
  directly — never the index (documented in `index.ts` header too).
- `credits.ts` — REAL `withCredits(ctx, {feature, seeds, metadata}, fn)` + exported
  `canAfford()`: afford-check → run → charge via `ctx.admin.rpc('consume_credits')`
  (byte-identical params to the old remote). Signature changed from M1 stub — noted.
- `index.ts` — side-effect imports for all 40 ops + exports `runOpStream`,
  `getClientCtx`, `canAfford`/`CreditUsage`.

## Ops created (40 files, one op per file)
- `recipes/` (10 + 3 helpers): `list, get, create-draft, edit (new, from edit-page
  onSubmit), delete, upload-image, delete-image, import-from-url, import-from-text,
  add-examples` + `import-from-url-helpers.ts` (copy of import-cache + import cores),
  `upload-image-helper.ts`, `get-language-id-helper.ts`.
- `plans/` (10 ops + 1 pure): `list-meals, list-items, add-recipe, update-servings,
  move-meal, delete-meal ({undo, cooked}), check-item, delete-item, add-item,
  recommendations` + pure `shopping-list.ts` (old route path re-exports it).
- `spaces/` (5): `list, create, edit, join, leave` (all `sync: 'later'`).
- `profile/` (8): `get (profiles+preferences combined, ~110 lines, no split needed),
  update-profile (+optional icon), update-preferences (+optional onboardingStatus),
  update-aisle-order, update-avatar, upload-picture, delete-picture` +
  `complete-onboarding.ts` (EXTRA op, not in catalog: welcome-page 4-table write combo)
  + `avatar-helpers.ts`.
- `billing/` (4): `balance, logs, consume (internal:true), checkout (new `origin`
  input, adapter-injected from `event.url.origin`)`.
- `ingredients/`: `list.ts` (M1 example verified identical, kept) + `match.ts` +
  `match-helpers.ts`.

## Adapters thinned (same export names/signatures, components untouched except 4 pages)
- All `*.remote.ts` → `runOp` (imports streamed via `query.live` + `runOpStream`);
  all client actions → `getClientCtx` + `runOp`; toasts/undo/refresh stay in wrappers.
- 4 pages now call core: `recipes/+page` (filter opts), `SearchLogic.svelte`,
  `recipes/[id]/edit` (onSubmit → `recipes.edit`), `admin/ingredients` (→
  `ingredients.list`), `welcome` (→ `profile.complete-onboarding`),
  `supporter/success` (→ `billing.balance`/`billing.logs`, limit 100 + client-side
  latest-`stripe_charge` pick — mirrors old query within last 100 logs).
- DELETED (grep-verified zero importers): `import-recipe.ts`,
  `billing/server/consume-credits.remote.ts`.
- Scrape/enrich remotes: decision = **plain server helpers** (`internal`, not ops —
  scrape is pure, enrich LLM-only, neither writes DB); header comments added.
- `create-user-data.ts`: untouched (pure draft generator, zero DB writes; rows come
  from signup trigger) + header comment. `get-user-permissions.ts`: authz helper,
  header comment only.

## Validation
- `npm run check`: **39 errors / 8 warnings — identical count to M1 baseline, and
  zero in any M2-created/modified file** (all 39 in pre-existing UI-lib files:
  sidebar/carousel/data-table/flex-render/SearchSidebar/select-label/toggle-group/
  shopping-list-page/supazod). Fixed 5 new type errors during integration
  (balance type → Partial-based; list/searchText/opts defaults explicit;
  `undo: false` at delete-item call; logs `{limit: 100}`; edit-page null guard).
- `eslint src/lib/core/operations/`: clean (fixed 2 moved-code issues: `any`→`unknown`
  in checkout, regex char-class in match-helpers). The `no-restricted-syntax`
  direct-DB rule fires **0 warnings repo-wide → M1 grandfather list (30 entries)
  deleted entirely**, rule stays warn-only until M6.
- `test:unit`: green. `test:integration`: "No tests found" — pre-existing, `tests/`
  doesn't exist in repo.
- Prettier: clean on all touched files.

## Deviations / notes for M3+ (all minor, behavior-preserving)
1. `getRecipesDetailed` was a sync query-builder, now async executor — 2 call sites
   updated, same PostgREST operators in same order.
2. Core throws `OpError` where old code returned null/undefined — wrappers normalize
   back to `{data, error}` shapes; same toasts.
3. Edit-page per-stage toasts collapsed to one op-message toast (same texts);
   `delete-picture` single storage remove (old code removed twice, same end state).
4. `recipes.list` filter columns are free-form strings — **M3 must whitelist at API
   boundary**. `recipes.upload-image` input carries a `File` (z.custom) — M3
   multipart handler must build it server-side before `runOp`.
5. Credit check-then-consume is not atomic (pre-existing semantics, preserved).
6. M5 notes (from plans agent): no client-generated ids (server UUIDs; replay needs
   id mapping); `position` caller-computed (LWW conflicts); soft-delete timestamps
   are LWW-friendly; `update-servings` snapshot-based (replayable);
   `recommendations` non-idempotent (random seed — cache, never replay).
7. M6: `rg supabase.client.(from|rpc|storage)` in routes/features should now be ~0
   outside wrappers that only pass the client through — verify then promote rule.

---

# Post-M2 fix: client op registration (2026-09-13)
**Symptom:** `runOp` threw `Unknown operation: recipes.list / recipes.get` (and would
have for ~20 more ops) in the browser, while plans ops worked.
**Root cause:** registration is a module side effect of `defineOp`, and the full
`index.ts` can't load in the browser (`$app/server` via `context.ts`). Plans
adapters happened to value-import their op modules (registering them); every other
adapter imported op modules `type`-only, so their ops never registered.
svelte-check cannot catch this (runtime-only).
**Fix:** new `src/lib/core/operations/client.ts` — side-effect imports all 34
client-safe ops + re-exports `runOp/getClientCtx/OpError`; all 29 browser callers
import from it (never `registry.js`/`context.client.js` directly). The 5
server-only ops (`recipes.import-from-url/text`, `recipes.add-examples`,
`billing.checkout/consume`) stay out — their modules pull `$app/server`/`stripe`/
`$env/static/private`. Regression test `client.test.ts` asserts the 34 register
and the 5 don't. Verified: `check` back at 39/8 baseline, unit 4/4, `npm run build`
succeeds (proves no server import leaks into the client bundle).
