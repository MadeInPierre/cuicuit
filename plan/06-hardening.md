# M6 — Hardening + cleanup (definition of done for the whole project)

> Read `plan/00-architecture-goal.md` (§7). Requires M2–M5 done. Smallest milestone:
> turn the migration into a maintainable steady state.

## Starting point

- All four sources work: app (M2), API (M3), MCP (M4), PowerSync phase-1 (M5).

## Tasks

1. **Delete dead code**: remove deprecated `features/**/queries|actions` re-export shims left in M2
   (only where zero imports remain — verify with `rg`), old inline SQL in pages, unused `supabase.client`
   imports in components. Move any straggler logic into its op file.
2. **Enforce**: promote the M1 eslint guard to **error** (no `supabase.client.from/rpc/storage` outside
   `src/lib/core/` + `src/lib/sync/`); `npm run lint` must fail on violation. Fix or allowlist with justification.
3. **Docs**: root-level `docs/operations.md` (user-facing: what each API/MCP tool does + credit costs from
   `FEATURE_COSTS`), update `README.md` links, `CHANGELOG/` entry. Sync publication doc for the deferred
   `later` tables (spaces/profile) so a future agent can flip them.
4. **Test backfill**: coverage for every public op via core (not via HTTP): one `runOp` round-trip each;
   keep `tests/api-v1.test.ts` + `tests/mcp.test.ts` + `tests/sync-mutations.test.ts` green.

## Acceptance criteria

- [ ] `rg "supabase\.client\.from|supabase\.client\.rpc|supabase\.client\.storage" src/routes src/lib/features --glob '*.svelte' --glob '*.ts'`
      returns zero hits outside `src/lib/core` + `src/lib/sync` (+ explicit allowlist file if any).
- [ ] Full suite green: `check` + `lint` (error-level guard) + `test:unit` + `test:integration` (both sync modes).
- [ ] A new agent can implement "add `pantry.add-item` op + API + MCP + sync" by following `docs/operations.md` alone
      (reviewer test: read docs, no code spelunking).

## Validation

```bash
npm run check
npm run lint
npm run test:unit
npm run test:integration
rg "supabase\.client\.(from|rpc|storage)" src/routes src/lib/features --glob '*.svelte' --glob '*.ts' | wc -l # expect 0
```
