# 🪺 Operations — the one place where data happens

> **New here (human or agent)? Start here.** This is the 0→60 guide to how Cuicuit
> touches the database — and how to add a new capability without breaking the nest.

## The one idea

Every database-touching thing in Cuicuit is defined **exactly once**, as an _operation_
(one file per operation), and then exposed through **thin doors**:

| Door            | Where                             | Who uses it                                      |
| --------------- | --------------------------------- | ------------------------------------------------ |
| 📱 App          | `*.remote.ts` + direct core calls | The Svelte UI you click                          |
| 🌐 REST API     | `src/routes/api/v1/...`           | Scripts, CLIs, integrations (JWT or PAT)         |
| 🤖 MCP          | `POST /mcp` (Streamable HTTP)     | AI agents like you, with a PAT                   |
| 💾 Offline sync | `src/lib/sync/`                   | _Not built yet — see `docs/sync-publication.md`_ |

An op is a pure async data function. No toasts, no `goto`, no HTTP, no MCP types
inside. Doors handle transport; the op handles data. That's the whole religion.

## Using the doors (consumers)

- **REST**: `Authorization: Bearer <Supabase JWT | cui_… PAT>`. Mint a PAT via
  `POST /api/v1/auth/tokens` (JWT only, secret shown once). Interactive schema:
  `GET /api/v1/openapi.json`. Human UI: `/api/v1/docs`. Cookbook with curl + SSE:
  [`src/routes/api/v1/README.md`](../src/routes/api/v1/README.md).
- **MCP**: point your client at `/mcp` with the PAT. `tools/list` works pre-auth
  (schemas only); `tools/call` needs auth. Cookbook:
  [`src/routes/mcp/README.md`](../src/routes/mcp/README.md).
- **Seeds** 💰: only the two recipe-import ops cost anything (1 seed each, charged
  _after_ success — failures are free). Everything else is unlimited.
  Check your pile with `seeds_balance` / `GET /api/v1/me/seeds`.
- **Errors** all look the same: `{ code, message }` over REST (HTTP status mapped:
  401/403/404/402/400/409/500), `isError` text (`"CODE: message"`) over MCP.
  `NOT_FOUND` means _"doesn't exist or isn't yours"_ — we never leak which.

## Adding an op (developers) — the `pantry.add-item` drill

Say pantry gets a table and you need `pantry.add-item` on all doors. Four steps,
no spelunking required:

**1. Define the op** — `src/lib/core/operations/pantry/add-item.ts`:

```ts
import { z } from 'zod';
import { defineOp } from '../registry.js';
import { OpError } from '../errors.js';

export const pantryAddItemInput = z.object({
	spaceId: z.string().min(1),
	name: z.string().min(1),
	quantity: z.number().nullable().default(null)
});

export const pantryAddItemOp = defineOp({
	name: 'pantry.add-item', // unique — this is the op's identity everywhere
	domain: 'pantry',
	kind: 'write', // 'read' | 'write' | 'rpc' | 'storage'
	sync: 'synced', // 'synced' | 'server-only' | 'later'
	docs: {
		title: 'Add a pantry item', // short label
		description: 'Adds an item to the space pantry.', // 1–3 sentences, agent-facing
		tool: 'pantry_add_item', // optional MCP override (default: dots/dashes → `_`)
		hints: ['Deletes are soft …'] // optional extra agent notes
	},
	input: pantryAddItemInput, // zod — validated at EVERY door, same schema
	handler: async (ctx, { spaceId, name, quantity }) => {
		// ctx.supabase = user-JWT client (RLS enforced) · ctx.userId = verified user
		// ctx.admin = service_role, server-only ops ONLY. No UI, no transport here.
		const { data, error } = await ctx.supabase
			.from('pantry_items')
			.insert({ space_id: spaceId, name, quantity })
			.select('id')
			.single();
		if (error || !data) throw new OpError('INTERNAL', 'Failed to add pantry item.', error);
		return data;
	}
});
```

**2. Register it** — import the file in **both**
`src/lib/core/operations/index.ts` (server: everything) and
`src/lib/core/operations/client.ts` (browser-safe ops only — never files that pull
`$app/server`, `stripe`, or `$env/static/private`).

**3. Open the doors:**

| Door    | Work                                                                                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📱 App  | Add a thin `*.remote.ts`: `query(inputSchema, (i) => runOp('pantry.add-item', await requireCtx('app'), i))`, or call `runOp` with `getClientCtx()` from `client.js`. Toasts/refresh stay in the component. |
| 🌐 REST | Add one entry to `API_ROUTES` in `src/routes/api/v1/openapi.ts` (OpenAPI renders itself) + a `<50`-line `+server.ts` (auth → parse → `runApiOp` → json). Copy a sibling.                                   |
| 🤖 MCP  | Nothing. 🎉 Tools render from the registry — your op appears automatically.                                                                                                                                |

**4. Harden it** (steal from siblings):

- Writes by id: append `.select('id')`, throw `OpError('NOT_FOUND', '<Thing> not found or not accessible.')` on zero rows (never `FORBIDDEN` — don't leak existence).
- User input reaching PostgREST builders (`.in/.overlaps/.or` columns): allowlist **in the op**, not the adapter (adapters are bypassable).
- Paid ops: gate via `withCredits()` in `credits.ts`, charged after success only.

Then run the gate: `npm run check` (39 pre-existing errors in UI-lib files, 0 in yours),
`npx eslint` on your files (the DB guard is `error` level — direct `.from/.rpc/.storage`
outside `core` fails the build), `npm run test:unit -- --run`, `npm run build`.

## The rules (all of them, on one napkin)

1. **One op = one file.** Over ~200 lines? Split helpers into `./<op>-helpers.ts`.
2. **No UI in core** (no toast/goto/Svelte state). **No transport in core** (no
   `getRequestEvent`/`Response`/MCP types). Adapters inject transport bits (`origin`, …).
3. **Auth is settled before you:** handler assumes `ctx.userId` is verified; RLS does
   the rest via `ctx.supabase`. `ctx.admin` only in `server-only` ops.
4. **Validation lives in the op's zod schema** — doors just forward to it.
5. **Credits only via `withCredits()`**, only inside the two import ops. Adapters never
   touch `billing.consume` (it's `internal` — invisible to API/MCP).
6. **DB changes go declarative**: `supabase/schema/*.sql` → `npx supabase db diff -f …` →
   review → `migration up` locally → `npm run db:types:local`. Never prod (a human does that).

## Op catalog (43 ops — generated from the registry, 2026-09-19)

Default MCP name = op name with `.`/`-` → `_`. Overrides shown. Six ops stay off MCP:
`auth.*` (PATs must not mint PATs), `recipes.upload-image` + `profile.upload-picture`
(binary multipart — use the REST routes), `billing.consume` (internal, no REST either).

### 🍳 Recipes (10)

| Op                         | REST                                     | MCP tool                   | Notes                             |
| -------------------------- | ---------------------------------------- | -------------------------- | --------------------------------- |
| `recipes.list`             | `GET /recipes`                           | `recipes_list`             | Column allowlist enforced in-core |
| `recipes.get`              | `GET /recipes/{id}`                      | `recipes_get`              |                                   |
| `recipes.create-draft`     | `POST /recipes/draft`                    | `recipes_create_draft`     |                                   |
| `recipes.edit`             | `PATCH /recipes/{id}`                    | `recipes_edit`             | Ownership pre-check → `NOT_FOUND` |
| `recipes.delete`           | `DELETE /recipes/{id}`, `POST …/restore` | `recipes_delete`           | Soft-delete flag                  |
| `recipes.upload-image`     | `POST /recipes/{id}/image` (multipart)   | —                          | No MCP (binary)                   |
| `recipes.delete-image`     | `DELETE /recipes/{id}/image`             | `recipes_delete_image`     |                                   |
| `recipes.import-from-url`  | `POST /recipes/import-url` (SSE)         | `recipes_import_from_url`  | 🌱 1 seed, `server-only`          |
| `recipes.import-from-text` | `POST /recipes/import-text` (SSE)        | `recipes_import_from_text` | 🌱 1 seed, `server-only`          |
| `recipes.add-examples`     | `POST /recipes/examples`                 | `recipes_add_examples`     | Free, `server-only`               |

### 🗓️ Plans & shopping (10)

| Op                      | REST                                                  | MCP tool                             |
| ----------------------- | ----------------------------------------------------- | ------------------------------------ |
| `plans.list-meals`      | `GET /spaces/{id}/meals`                              | `plan_list`                          |
| `plans.list-items`      | `GET /spaces/{id}/items`                              | `shopping_list`                      |
| `plans.add-recipe`      | `POST /spaces/{id}/meals`                             | `plan_add_recipe`                    |
| `plans.update-servings` | `PATCH /spaces/{id}/meals/{mealId}` (with `servings`) | `plan_update`                        |
| `plans.move-meal`       | same (with `position`)                                | `plans_move_meal`                    |
| `plans.delete-meal`     | `DELETE …`, `POST …/restore`, `cooked` flag           | `plans_delete_meal`                  |
| `plans.check-item`      | `PATCH /spaces/{id}/items/{itemId}`                   | `shopping_check`                     |
| `plans.delete-item`     | `DELETE …`, `POST …/restore`                          | `plans_delete_item`                  |
| `plans.add-item`        | `POST /spaces/{id}/items`                             | `shopping_add`                       |
| `plans.recommendations` | `GET /spaces/{id}/recommendations`                    | `plans_recommendations` (online RPC) |

Plus derived routes with no own op: `GET /spaces/{id}` (via `spaces.list`),
`GET /spaces/{id}/shopping-list` (meals + items + pure helper).

### 🏠 Spaces (5) · 👤 Profile (8) · 💰 Billing (4) · 🧂 Ingredients (2) · 🔑 Auth (3) · 🌍 Languages (1)

| Op                                                                                                                                 | REST                                          | MCP tool                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `spaces.list/create/edit/join/leave`                                                                                               | `/api/v1/spaces*`                             | `spaces_list/create/edit/join/leave`        |
| `profile.get/update-profile/update-preferences/update-aisle-order/update-avatar/upload-picture/delete-picture/complete-onboarding` | `/api/v1/me*`                                 | `profile_*` (upload pictured via REST only) |
| `billing.balance/logs`                                                                                                             | `GET /me/seeds`, `GET /me/seeds/logs`         | `seeds_balance/logs` (read-only)            |
| `billing.checkout`                                                                                                                 | `POST /billing/checkout`                      | — (URL flow, link only)                     |
| `billing.consume`                                                                                                                  | —                                             | — (internal)                                |
| `ingredients.match/list`                                                                                                           | `POST /ingredients/match`, `GET /ingredients` | `ingredients_match/list`                    |
| `auth.create-token/list-tokens/revoke-token`                                                                                       | `GET/POST/DELETE /auth/tokens` (JWT-only)     | — (by design)                               |
| `languages.list`                                                                                                                   | `GET /languages`                              | `languages_list`                            |

## File map (where lives what)

```
src/lib/core/operations/   ← the nest: registry · context · auth · credits · errors
  <domain>/<op>.ts         ← one op per file + docs + zod input
  index.ts / client.ts     ← registration (server / browser-safe)
src/routes/api/v1/         ← REST doors + openapi.ts route map + README cookbook
src/routes/mcp/            ← MCP door (auto-renders registry) + README cookbook
src/lib/mcp/tools.ts       ← registry → MCP tools bridge
supabase/schema/           ← declarative DB truth (see AGENTS.md for the flow)
```

> 🐣 _Remember: the nest only works if everyone builds in it. New data thing?
> `defineOp` first, doors second. Future you says thanks._
