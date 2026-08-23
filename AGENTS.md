This project is an open-source recipe web app named 'Cuicuit' based on Svelte 5, SvelteKit, shadcn-svelte, Supabase, TailwindCSS, and TypeScript.

Its goal is to distribute the app both as a hosted SaaS version and as a self-hosted docker deployment.

The hosted version (https://cuicuit.laclau.dev) has this additional setup (free tiers everywhere for now):
- Hosted on Vercel and Supabase Cloud
- Vercel Analytics & Speed Insights and PostHog EU Cloud analytics enabled
- Supabase is connected to Resend for email delivery
- AI features use the Vercel AI SDK with several providers (Mistral, custom OpenAI-compatible endpoints, and more)

No self-hosted version available yet, the app is in active development and will be released soon.