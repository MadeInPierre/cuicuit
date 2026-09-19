# 🤖 Cuicuit MCP endpoint

Stateless Streamable HTTP at `/mcp` — no SDK dependency, plain JSON-RPC 2.0 over
`POST`. `GET` returns `405` (`Allow: POST`). Every tool is auto-derived from the
op registry (`defineOp` + zod input), so the catalog below never goes stale —
`tools/list` is the truth. New to the architecture? Read
[`docs/operations.md`](../../../docs/operations.md) first. 🪺

## Setup

1. Mint a PAT: `POST /api/v1/auth/tokens` with your Supabase JWT (`{"name":"agent"}`).
   The secret is shown once — store it, it never appears again.
2. Point your MCP client (e.g. the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector))
   at `http://localhost:5173/mcp` with `Authorization: Bearer cui_...`.

`tools/list` works without credentials (schemas only); `tools/call` requires auth.
Identity fields (`createdBy`, `userId`) are stripped from tool schemas and forced
from the credential — never pass them.

## Tools (37 — one per public op)

| Area               | Tools                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 🍳 Recipes         | `recipes_list/get/create_draft/edit/delete/delete_image/import_url/import_text/add_examples`                                 |
| 🗓️ Plan & shopping | `plan_list/add_recipe/update`, `plans_move_meal/delete_meal`, `shopping_list/add/check`, `plans_delete_item/recommendations` |
| 🏠 Spaces          | `spaces_list/create/edit/join/leave`                                                                                         |
| 👤 Profile         | `profile_get/update_profile/update_preferences/update_aisle_order/update_avatar/delete_picture/complete_onboarding`          |
| 💰 Seeds           | `seeds_balance`, `billing_logs` (read-only)                                                                                  |
| 🧂 Misc            | `ingredients_match/list`, `languages_list`                                                                                   |

Hidden by design: `auth.*` token ops (PATs must not mint PATs), `recipes_upload_image`

- `avatar_upload_picture` (binary multipart — use the REST routes), `billing.consume`
  (internal). `billing.checkout` has no tool either (payment URL flow — use REST).

## Seeds 💰

Only `recipes_import_url` and `recipes_import_text` cost seeds (**1 each, charged
only after success** — failures are free and create nothing). Broke? You'll get
`isError: "INSUFFICIENT_SEEDS: ..."` — top up in the app billing section, agents
can't pay. Check your pile anytime with `seeds_balance`.

## Typical agent flow

`spaces_list` → `recipes_add_examples` (free starters) or `recipes_list` →
`plan_add_recipe` → `shopping_check`. Then peek at the app UI — your plan is there. ✨

## Smoke test (curl)

```bash
BASE=http://localhost:5173/mcp
PAT=cui_<id>_<secret>

# 1. Handshake
curl -s -X POST $BASE -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}'

# 2. List tools (pre-auth, schemas only)
curl -s -X POST $BASE -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | head -c 300

# 3. Seed balance
curl -s -X POST $BASE -H "Authorization: Bearer $PAT" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"seeds_balance","arguments":{}}}'

# 4. Add an item (needs a space id — grab one via spaces_list)
curl -s -X POST $BASE -H "Authorization: Bearer $PAT" -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"shopping_add","arguments":{"spaceId":"<uuid>","name":"Milk"}}}'
```

Op errors arrive as `isError` results (`"INSUFFICIENT_SEEDS: ..."`); missing or
bad credentials are HTTP `401`. Tool list, names, and schemas render from the
op registry (`defineOp(..., docs)` + zod input) — see `src/lib/mcp/tools.ts`.
