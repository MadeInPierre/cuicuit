# Cuicuit MCP endpoint (POC)

Stateless Streamable HTTP at `/mcp` — no SDK dependency, plain JSON-RPC 2.0 over
`POST`. `GET` returns `405` (`Allow: POST`).

## Setup

1. Mint a PAT: `POST /api/v1/auth/tokens` with your Supabase JWT (`{"name":"agent"}`).
2. Point your MCP client at `http://localhost:5173/mcp` with
   `Authorization: Bearer cui_...`.

`tools/list` works without credentials (schemas only); `tools/call` requires auth.
Identity fields (`createdBy`, `userId`) are stripped from tool schemas and forced
from the credential — never pass them.

## Smoke test (curl)

```bash
BASE=http://localhost:5173/mcp
PAT=cui_<id>_<secret>

# 1. Handshake
curl -s -X POST $BASE -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}'

# 2. List tools (pre-auth)
curl -s -X POST $BASE -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | head -c 300

# 3. List language codes (every language input is `lang`, e.g. `en-US`)
curl -s -X POST $BASE -H "Authorization: Bearer $PAT" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"languages_list","arguments":{}}}'

# 3. Seed balance
curl -s -X POST $BASE -H "Authorization: Bearer $PAT" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"seeds_balance","arguments":{}}}'

# 4. Add + check an item (needs a space id from the app)
curl -s -X POST $BASE -H "Authorization: Bearer $PAT" -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"shopping_add","arguments":{"spaceId":"<uuid>","name":"Milk"}}}'
```

Op errors arrive as `isError` results (`"INSUFFICIENT_SEEDS: ..."`); missing or
bad credentials are HTTP `401`. Tool list, names, and schemas render from the
op registry (`defineOp(..., docs)` + zod input) — see `src/lib/mcp/tools.ts`.
