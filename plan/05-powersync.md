# M5 — PowerSync (offline recipes/ingredients read + meals/items read/write)

> Read `plan/00-architecture-goal.md` (§5 sync column + §6 sync contract). M2 done required.
> Scope is deliberately narrow: **recipes/ingredients (+translations/languages) offline read** and
> **`space_meals`/`space_items` offline read/write**. Everything else stays direct (spaces/profile
> publication designed but not switched on — see task 5).

## Starting point

- Core ops own all logic; `requireCtx('sync')` throws; no `src/lib/sync/`; `persistent-sync-mode.svelte.ts`
  flag exists for gating.

## Tasks

1. **Schema + connector**: add `@powersync/web` (+ `client` JS dep), `src/lib/sync/schema.ts`
   (tables: `languages`, `ingredients`, `ingredient_translations`, `recipes`, `recipe_ingredients`,
   `space_meals`, `space_items` — column subset actually read by R1/R2/P1/P2), `connector.ts`
   (Supabase JWT → PowerSync token; backend connector config documented, self-host compatible),
   `mutations.ts` mapping local writes → op names (`plans.add-recipe/update-servings/move-meal/delete-meal/
check-item/delete-item/add-item`, `recipes.edit/delete/create-draft`).
   ⚠️ First confirm the `recipes` RLS predicate in `supabase/schemas/99_RLS.sql`
   (global template `author_id IS NULL` + own copies) and encode exactly that in the publication —
   do not guess.
2. **Reads offline**: `recipes.list/get`, `ingredients.list/match-tables`, `plans.list-meals/list-items`
   gain a `source: 'sync'` path (local query when `syncMode` on, Supabase when off). `shopping-list.ts`
   pure helper runs unchanged on local rows. Search: local prefix/substring first, server FTS fallback online.
3. **Writes offline (meals/items + recipe edits)**: local-first apply in PowerSync Tx, enqueue mutation,
   replay via `runOp` on reconnect (idempotent: client-generated UUIDs; soft-delete flags win;
   `position` last-write-wins; `cooked`/`checked_at` idempotent). Import/billing/recommendations/RPCs stay
   online-only: queue an _intent_ offline, execute on reconnect with user-visible pending state.
4. **State wiring**: `active-space.svelte.ts` refresh fns become sync subscribers when flag on
   (no more manual refresh-after-mutation on the synced path); keep direct path intact when flag off.
   All behind the existing sync-mode flag → instant rollback.
5. **Prepare-but-don't-flip** the `later` tables: write the `spaces`/`user_*` publication definition
   (by `space_members.user_id` / `user_id`) + doc, leave disabled with a `TODO(M6)` marker.

## Acceptance criteria

- [ ] Airplane-mode demo: open `/recipes` (cached), search, open `/plan`, add/move/check/delete meal+items —
      all render locally; reconnect replays with zero conflicts lost and UI converges.
- [ ] Two-device convergence: meal edit on A + check on B merge to the same final state (document LWW outcome).
- [ ] Online-only ops degrade cleanly offline (import/recommend buttons show queued/disabled, no crash, execute on reconnect).
- [ ] Flag-off path is byte-identical behavior to M2 (regression suite green both modes).
- [ ] `npm run check` + `lint` pass; no `server-only` op is enqueued as a row write (audit `mutations.ts`).

## Validation

```bash
npm run check
npm run lint
npm run test:unit
npm run test:integration # run twice: sync OFF (must pass unmodified) + sync ON for plan/recipes specs
# new: tests/sync-mutations.test.ts — replay add/check/delete/move offline queue in order, assert converged rows
```

Manual: devtools offline → full plan workflow → online → verify Supabase rows + second browser converges.
Open item carried from goal doc: confirm `recipes` publication predicate vs `99_RLS.sql` before enabling read sync.
