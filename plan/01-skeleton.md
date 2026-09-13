# M1 — Architecture skeleton (no functional migration)

> Read `plan/00-architecture-goal.md` first. This milestone creates the empty-but-compiling
> skeleton that all later milestones fill in. **Zero behavior change.**

## Starting point

- Fresh checkout; app works as today (client-direct + `*.remote.ts` coexist).
- `src/lib/core/` does not exist; no `src/routes/api/v1`, no `src/routes/mcp`, no `src/lib/sync`.

## Tasks

1. Create `src/lib/core/operations/` with the **exact contract from §4 of the goal doc**:
   - `registry.ts` — `OpSource/OpCtx/OpDef/defineOp/registry/runOp` (+ `OpError` or separate `errors.ts`; either is fine, document choice).
   - `context.ts` — `requireCtx(source)` for `'app'` only (from `getRequestEvent().locals`); throw `TODO(auth-tokens)` for `'api'|'mcp'|'sync'` for now.
   - `auth.ts` — re-export `serverIsUserAuthenticated` + `requireUserId`; PAT resolver stub throws `not-implemented`.
   - `credits.ts` — `withCredits()` stub (pass-through, logs feature name; real move happens in M2).
   - `errors.ts` — `OpError { code, message, details? }` + `toStatus()` mapper (401/403/404/402/400/500) for future API use.
   - Empty domain folders `recipes/ plans/ spaces/ profile/ billing/ ingredients/ auth/` each with a `.gitkeep` or `README.md` (one line: owner milestone).
2. Add **one example op end-to-end (skeleton only, unused by UI)**: `ingredients/list.ts`
   (`ingredients.list`, read, synced) implemented via `defineOp` + registered, proving the pattern compiles.
3. Wire `registry` self-registration: importing `src/lib/core/operations/<domain>/*.ts` registers;
   add `src/lib/core/operations/index.ts` importing all (currently just the example) for future adapters.
4. Add eslint guard **warn-only** (do not break build): no new `supabase.client.from` imports outside
   `src/lib/core/`, `src/lib/sync/`, existing feature files (grandfather current files via allowlist comment).
5. Typecheck + lint clean. No UI changes, no route changes, no migration.

## Acceptance criteria

- [ ] `src/lib/core/operations/{registry,context,auth,credits,errors,index}.ts` exist and match §4 shapes (`OpCtx{ supabase, admin?, userId, source, signal? }`, `OpDef{ name, domain, kind, sync, credits?, input, handler, internal? }`).
- [ ] `defineOp('ingredients.list')` is registered and importable from `index.ts` without touching any UI.
- [ ] `npm run check` passes; `npm run lint` passes (new rule warn-only, zero errors).
- [ ] `git status` shows only `plan/` (this project) + `src/lib/core/` additions — no edits to existing features/routes.

## Validation

```bash
npm run check
npm run lint
npm run test:unit # must stay green (no new behavior → no new failures)
```

Manual: `vite dev`, load `/recipes` + `/plan` — identical behavior (no code path changed).

---

# Implementation done: report

M1 skeleton done. Summary:
Created src/lib/core/operations/ — exact §4 contract:
- registry.ts — OpSource/OpCtx/OpDef/defineOp/registry/runOp (duplicate names throw; runOp validates via zod; streaming handlers fail fast until M2's runner)
- errors.ts — OpError{code,message,details?} + toStatus(); re-exported from registry (documented choice)
- context.ts — requireCtx('app') from getRequestEvent().locals (supabase + admin + verified userId); api/mcp/sync throw TODO(auth-tokens); marked server-only
- auth.ts — re-exports existing serverIsUserAuthenticated (single implementation untouched) + requireUserId() + resolvePatToken() stub for M3
- credits.ts — withCredits() pass-through stub logging feature/seeds; real move in M2
- ingredients/list.ts — example op (ingredients.list, read/synced) mirroring the admin browser query, registered, unused by UI
- index.ts — side-effect registration + single-import surface for adapters
- 7 domain folders with owner README placeholders
Eslint guard (warn-only) in eslint.config.js: no-restricted-syntax flags *.client.from/rpc/storage and *.supabase[.Admin].from/rpc/storage outside core/sync/shared-db, with all 30 current direct-access files grandfathered in ignores. Verified it fires exactly once on a scratch file (.auth calls untouched) with exit 0.
Validation:
- svelte-check: 39 errors / 8 warnings — byte-identical to pre-change baseline (verified via git stash), 0 from new code
- prettier --check on new files + eslint on new files: clean (repo-wide npm run lint fails on 354 pre-existing unformatted files — untouched, not mine)
- test:unit: green; throwaway 4-test runtime smoke (registration, NOT_FOUND, zod defaults, duplicate rejection, toStatus) passed, then removed
Deviations/notes for M2: none from the goal doc. Two things the M2 agent should know: runOp takes Promise handlers only (streaming runner still to come), and context.ts statically imports $app/server so it must stay server-only.