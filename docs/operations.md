# Core Operations — the one place where data happens

> **New to Cuicuit development? Start here.** This is the 0-60 guide to how Cuicuit touches the database.

## The one idea

Every database-touching thing in Cuicuit is defined once as an **operation**
(one file per operation), and then exposed through **thin doors**:

| Door           | Where                             | Who uses it                                      |
| -------------- | --------------------------------- | ------------------------------------------------ |
| 📱 App          | `*.remote.ts` + direct core calls | The Web UI you click                             |
| 🌐 REST API     | `src/routes/api/v1/...`           | Scripts, CLIs, integrations (JWT or PAT)         |
| 🤖 MCP          | `POST /mcp` (Streamable HTTP)     | AI agents, with a PAT                            |
| 💾 Offline sync | `src/lib/sync/`                   | _Not built yet — see `docs/sync-publication.md`_ |

An op is a pure async data function. No UI toasts, no `goto`, no HTTP, no MCP types
inside. Doors handle transport, while the op handles data.

## Using the doors (consumers)

The REST API and MCP doors use PATs (Personal Access Tokens) for auth. Create one via `POST /api/v1/auth/tokens` (JWT only) or using the Web UI settings.

- **REST**: Use the header `Authorization: Bearer <Supabase JWT | cui_… PAT>`.
  - OpenAPI schema: `GET /api/v1/openapi.json`. 
  - Human Swagger UI (Scalar): `/api/v1/docs`.
  - Docs with curl + SSE: [`src/routes/api/v1/README.md`](../src/routes/api/v1/README.md).
- **MCP**: point your client at `/mcp` with the PAT. `tools/list` works pre-auth
  (schemas only); `tools/call` needs auth. Cookbook:
  [`src/routes/mcp/README.md`](../src/routes/mcp/README.md).
- **Seeds** (i.e. credits): only recipe-import ops cost anything (1 seed each, charged
  _after_ success — failures are free). Everything else is unlimited.
- **Errors** all look the same: `{ code, message }` over REST, `isError` text (`"CODE: message"`) over MCP. `NOT_FOUND` means _"doesn't exist or isn't yours"_ — we never leak which.

## Adding an op (developers) — the `pantry.add-item` drill

Let's take an example. Say we add a pantry feature, which gets a table and you need `pantry.add-item` on all doors. Follow these four steps:

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
	input: pantryAddItemInput, // zod input gets validated for every door
	handler: async (ctx, { spaceId, name, quantity }) => {
		// ctx.supabase = user-JWT supabase client (RLS enforced). ctx.userId = verified user
		// ctx.admin = supabase client with service_role, exists for server ops ONLY.

		// Do whatever logic you need, including DB calls:
		const { data, error } = await ctx.supabase
			.from('pantry_items')
			.insert({ space_id: spaceId, name, quantity })
			.select('id')
			.single();

		// Errors will be sent to the door (REST, MCP, or app), useful for agents.
		if (error || !data) throw new OpError('INTERNAL', 'Failed to add pantry item.', error);
		return data;
	}
});
```

**2. Register it** — import the file in **both**:
- `src/lib/core/operations/index.ts` (server: everything)
- `src/lib/core/operations/client.ts` (browser-safe ops only — never files that use `ctx.admin`, Stripe, or private environment variables).

**3. Open the doors:**

| Door   | Work                                                                                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📱 App  | Add a thin `*.remote.ts`: `query(inputSchema, (i) => runOp('pantry.add-item', await requireCtx('app'), i))`, or call `runOp` with `getClientCtx()` from `client.js`. Toasts/refresh stay in the component. |
| 🌐 REST | Add one entry to `API_ROUTES` in `src/routes/api/v1/openapi.ts` (OpenAPI renders itself) + a `<50`-line `+server.ts` (auth → parse → `runApiOp` → json). Copy a sibling.                                   |
| 🤖 MCP  | Nothing. 🎉 Tools render from the registry — your op appears automatically.                                                                                                                                 |

**4. Harden it** (steal from siblings):

- Writes by id: append `.select('id')`, throw `OpError('NOT_FOUND', '<Thing> not found or not accessible.')` on zero rows (never `FORBIDDEN` — don't leak existence).
- User input reaching PostgREST builders (`.in/.overlaps/.or` columns): allowlist **in the op**, not the adapter (adapters are bypassable).
- Paid ops: gate via `withCredits()` in `credits.ts`, charged after success only.

Then run the gate: `npm run check`, `npx eslint` on your files (direct `.from/.rpc/.storage` outside `core` fails the build), `npm run test:unit`, `npm run build`.

**Tests catch regressions the type checker can't.** Beyond the framing suites
(`client.test.ts`, `api-v1.test.ts` + API↔MCP parity, `mcp.test.ts`),
`src/lib/core/operations/roundtrip.test.ts` runs **one real `runOp` round-trip per
public op** against local Supabase (registration, RLS scoping, undo, seeds, PAT
lifecycle — the exact bugs that hit live in the past). It needs `npm run db:start`
and `SUPABASE_SECRET_KEY`; without them it skips cleanly so CI stays green.
Run `npx vitest run src/lib/core/operations/roundtrip.test.ts` after touching any op.

## The rules

1. **One op = one file.** Over ~200 lines? Split helpers into `./<op>-helpers.ts`.
2. **No UI in core** (no toast/goto/Svelte state). **No transport in core** (no
   `getRequestEvent`/`Response`/MCP types). Adapters inject transport bits (`origin`, …).
3. **Auth is settled before you:** handler assumes `ctx.userId` is verified; RLS does
   the rest via `ctx.supabase`. `ctx.admin` only in `server-only` ops.
4. **Validation lives in the op's zod schema** — doors just forward to it.
5. **Credits only via `withCredits()`**, only inside the two import ops. Adapters never touch `billing.consume`.
6. **DB changes are declarative**: Edit `supabase/schema/*.sql` → run `npx supabase db diff -f …` → review → `migration up` locally → `npm run db:types:local`. Never prod (a human does that).

## Important files

```
src/lib/core/operations/   ← the nest: registry · context · auth · credits · errors
  <domain>/<op>.ts         ← one op per file + docs + zod input
  index.ts / client.ts     ← registration (server / browser-safe)
src/routes/api/v1/         ← REST doors + openapi.ts route map + README cookbook
src/routes/mcp/            ← MCP door (auto-renders registry) + README cookbook
src/lib/mcp/tools.ts       ← registry → MCP tools bridge
supabase/schema/           ← declarative DB truth (see AGENTS.md for the flow)
```
