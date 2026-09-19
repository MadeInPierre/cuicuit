This project is an open-source recipe web app named 'Cuicuit', distributed as both a hosted SaaS version and as a self-hosted docker deployment.

Tech stack: Svelte 5, SvelteKit, shadcn-svelte, Supabase, TailwindCSS (avoid raw CSS), TypeScript, Vercel AI SDK.

Architecture: The entire app logic is centralized in `src/lib/core/operations` to be reused by the app, API, and MCP. If you need to work on operations, you should read `docs/operations.md` first. Core has a DB-backed round-trip suite (`src/lib/core/operations/roundtrip.test.ts`, one `runOp` per public op against local Supabase).

The Supabase schema uses the declarative approach defined at `supabase/schema/*.sql`. Follow these steps anytime schema changes are needed:
- Change the schema in the declarative files, do not change the database directly or write migrations manually.
- Generate the migration using `npx supabase db diff -f my_migration`.
- Warning: this automatic migration generation is not perfect, so check the generated migration file. It may introduce noise and probably doesn't handle security policies correctly. Adjust it to fit your intended schema changes. Both the declarative schema and the generated migration should be in sync, maintain both.
- Run `npx supabase migration up` to apply the migration on the local dev setup and `npm run db:types:local` to update the TypeScript types and zod schemas.
- NEVER TOUCH PROD YOURSELF (e.g. AVOID running `npx supabase db push` which would overwride the production database schema), the user will handle it.

The [hosted version](https://cuicuit.laclau.dev) has this additional setup:
- Cloudflare DNS
- Hosted on Vercel and Supabase Cloud
- Vercel Analytics & Speed Insights as well as PostHog EU Cloud analytics enabled
- Resend for email delivery, connected to Supabase
- AI features use the Vercel AI SDK with several providers (Mistral, custom OpenAI-compatible endpoints, Groq, etc.)

No self-hosted version available yet, the app is in active development and will be released as a docker-compose deployment soon.

Always follow KISS and YAGNI principles, aim for simplicity and a clean & easy-to-understand codebase with no code duplication. Prefer a clean codebase, it's fine to break backward compatibility - ask the user to confirm before implementing.

Never go deep into node_modules or try to reproduce internal supabase behavior to debug a hard issue. Just refer to the documentation and try your best guess fix.
