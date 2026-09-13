# M4 — MCP server (Streamable HTTP)

> Read `plan/00-architecture-goal.md` (§5 + §6 MCP contract). M2 done required, M3 (PATs) done
> required (MCP reuses `requireCtx` + PAT auth).

## Starting point

- Core ops + `requireCtx('api')` + `user_api_tokens` exist. No `src/routes/mcp` route.

## Tasks

1. **Single route** `src/routes/mcp/+server.ts` (Streamable HTTP): `POST` handles JSON-RPC
   (`initialize`, `tools/list`, `tools/call`); `GET` returns 405 with `Allow: POST` (no SSE-stream GET
   in v1 — keep it simple). Use the MCP TypeScript SDK (`@modelcontextprotocol/sdk`, add dep) for
   protocol framing; tool handlers are `runOp(name, await requireCtx('mcp', event), args)`.
2. **Tool generation from `registry`**: one tool per op where `!internal` (~30 tools, names in §5:
   `recipes_list/get/create_draft/edit/delete/upload_image/import_url/import_text/add_examples`,
   `plan_list/add_recipe/update/move/cooked`, `shopping_list/add/check/delete/recommend`,
   `spaces_list/create/edit/join/leave`, `profile_get/update/*`, `avatar_*`, `seeds_balance/logs`,
   `ingredients_match/list`). Description + `inputSchema` auto-derived from each op's zod schema
   (convert zod→JSON Schema once in `src/lib/mcp/schema.ts`); credit-costing tools annotate
   `seeds: 1` in description. `billing.consume`, `scrape`, `enrich` excluded.
3. **Auth**: same `Authorization: Bearer <jwt|pat>` as API (PAT is the expected agent credential).
   Progressive disclosure: `tools/list` works pre-auth (schema only); `tools/call` requires auth.
   Paid tools return `isError` with `INSUFFICIENT_SEEDS` (never partial writes — core guarantees charge-after-success).
4. **Binary**: `recipes_upload_image` takes `{ recipeId, fileName, contentType }` → returns presigned upload URL
   (agent PUTs to storage directly); no base64 over tool calls.
5. Smoke doc: `src/routes/mcp/README.md` (inspector URL, PAT setup, 3 example calls).

## Acceptance criteria

- [ ] MCP inspector connects to `/mcp` with a PAT, lists all §5 tools with correct schemas.
- [ ] End-to-end agent flow works: `recipes_import_url` → `plan_add_recipe` → `shopping_check` against dev, visible in app UI.
- [ ] Paid tool with empty seeds returns clean `isError` (402-equivalent), no recipe created.
- [ ] Cross-user isolation holds (PAT of user A cannot touch user B's spaces).
- [ ] No new DB tables; `npm run check` + `lint` pass.

## Validation

```bash
npm run check
npm run lint
npm run test:unit
# new: tests/mcp.test.ts — list (count == public ops), call recipes_get + plans.add-item→check-item round-trip,
# 402 path on import with mocked empty balance, auth rejection without token
npm run test:integration # app regression (MCP adds routes only)
```

Manual: MCP inspector → `tools/list` → `tools/call seeds_balance` → `tools/call recipes_import_url` (progress notifications) → verify in `/recipes`.
