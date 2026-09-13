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
