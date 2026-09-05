This project is an open-source recipe web app named 'Cuicuit', distributed as both a hosted SaaS version and as a self-hosted docker deployment.

Tech stack: Svelte 5, SvelteKit, shadcn-svelte, Supabase, TailwindCSS (avoid raw CSS), and TypeScript.

The Supabase schema uses the declarative approach defined at `supabase/schema/*.sql`. Follow these steps anytime schema changes are needed:
- Change the schema in the declarative files, do not change the database directly or write migrations manually.
- Generate the migration using `npx supabase db diff -f my_migration`.
- Run `npx supabase migration up` to apply the migration on the local dev setup and `npm run db:types:local` to update the TypeScript types and zod schemas.
- NEVER TOUCH PROD YOURSELF (e.g. AVOID running `npx supabase db push` which would overwride the production database schema), the user will handle it themselves.

The [hosted version](https://cuicuit.laclau.dev) has this additional setup:
- Cloudflare DNS
- Hosted on Vercel and Supabase Cloud
- Vercel Analytics & Speed Insights as well as PostHog EU Cloud analytics enabled
- Resend for email delivery, connected to Supabase
- AI features use the Vercel AI SDK with several providers (Mistral, custom OpenAI-compatible endpoints, Groq, etc.)

No self-hosted version available yet, the app is in active development and will be released as a docker-compose deployment soon.

Always follow KISS and YAGNI principles, aim for simplicity and a clean & easy-to-understand codebase with no code duplication. If a cleaner code is possible but would break backward compatibility or involve a large refactor, assume the user prefers breaking backward compatibility for a cleaner codebase at the end, but ask them for confirmation before implementing.