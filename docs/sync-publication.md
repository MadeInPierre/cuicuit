# 💾 Sync publication — flipping the `later` tables (future work)

> PowerSync is **deferred** (see `plan/05-powersync.md`). Nothing here is built.
> This doc tells a future agent exactly what to publish when the sprint comes.

## Status today

- `src/lib/sync/` does not exist. `requireCtx('sync')` throws.
- Every op already carries its future: `sync: 'synced'` (~18 ops, offline-capable),
  `'server-only'` (~12, never synced: imports, billing, tokens, RPCs), `'later'`
  (~13, designed below).
- Phase-1 offline scope (locked): recipes/ingredients **read**, `space_meals` /
  `space_items` **read + write**. Scrape/LLM/billing stay online-only, forever.

## The `later` tables — publication design

All `spaces.*` (5 ops) and `profile.*` (8 ops) are `sync: 'later'`. When PowerSync
lands, publish them like this:

| Tables                                                     | Publication rule                                      | Notes                                   |
| ---------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `spaces`, `space_members`                                  | `WHERE space_members.user_id = <jwt uid>` (join both) | Mirrors the RLS: membership-gated reads |
| `user_profiles`, `user_preferences`, `users` (avatar meta) | `WHERE user_id = <jwt uid>`                           | Trivial per-user sync                   |
| `user_api_tokens`                                          | **never sync**                                        | Secrets stay server-side, always        |

## Replay notes (from the M2 plans audit — don't re-learn these)

- Server mints UUIDs today; offline replay needs client-generated ids + id mapping.
- `position` is caller-computed → last-writer-wins conflicts on reorder.
- Soft-delete timestamps (`deleted_at`) are LWW-friendly. 🙂
- `update-servings` is snapshot-based → replayable as-is.
- `recommendations` uses a random seed → cache the last result, never replay.

## When you build it

1. Create `src/lib/sync/` (`schema.ts`, `connector.ts`, `mutations.ts` per
   `plan/00-architecture-goal.md` §6): map local writes to `runOp` names for replay;
   server-only ops are never enqueued as row writes.
2. Flip `sync: 'later'` → `'synced'` on the ops you publish.
3. Add `tests/sync-mutations.test.ts` (named in `plan/06-hardening.md`, never written).
4. Keep the eslint guard happy: `src/lib/sync/**` is already in its ignore list.
