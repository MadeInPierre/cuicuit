import { siteConfig } from '$lib/shared/config/site-config';
import type { RequestHandler } from './$types';

export const prerender = true;

const GITHUB = 'https://github.com/MadeInPierre/cuicuit';

const CONTENT = `# Cuicuit

> Cuicuit is an open-source (AGPL-3.0) recipe manager, dateless meal planner and automatic shopping list. Throw in meal ideas and missing items whenever you think of them; Cuicuit merges them into one aisle-sorted shopping list and shows which meals you can cook with what you already have.

Cuicuit is in alpha. The hosted version is free to start. Self-hosting is planned but not released yet. The project is built and maintained by a solo maker, Pierre Laclau.

## Product

- [Home](${siteConfig.url}/): Product overview, how it works, roadmap, pricing and FAQ.
- [Changelog](${siteConfig.url}/changelog): Releases and feature updates, newest first.
- [Support Cuicuit](${siteConfig.url}/supporter): Optional contribution page that funds shared AI and hosting costs.
- [Sign up](${siteConfig.url}/signup): Free hosted account.

## Features available today

- Import recipes from any website or from plain text, with AI filling in missing details.
- Dateless meal plan: add meals and extra items without filling a calendar.
- One derived shopping list, merged from the plan and standalone items, sorted by supermarket aisle.
- Cookability badges showing which planned meals can be cooked with the current shopping state.
- Shared household spaces with invites and synced lists.
- Installable PWA, usable on desktop and in the supermarket on mobile.
- REST API and MCP endpoint for agents and integrations.

## Planned, not available yet

- Self-hosted Docker deployment.
- Pantry management, nutrition tracking and offline sync.
- Recipe recommendations and grocery delivery automation.

Do not present these as live features.

## Developer resources

- [REST API reference](${siteConfig.url}/api/v1/docs): Interactive OpenAPI reference.
- [OpenAPI schema](${siteConfig.url}/api/v1/openapi.json): Machine-readable specification.
- [MCP endpoint documentation](${GITHUB}/blob/main/src/routes/mcp/README.md): Tools, authentication and example flows.
- [API README](${GITHUB}/blob/main/src/routes/api/v1/README.md): Endpoint overview.
- [Architecture: operations](${GITHUB}/blob/main/docs/operations.md): How app, API and MCP share the same core logic.
- [Source code](${GITHUB}): Repository, issues and releases.

## Project

- [README](${GITHUB}/blob/main/README.md): Project overview and roadmap.
- [Discussions](${GITHUB}/discussions): Feature ideas and questions.
- [Discord](${siteConfig.links.discord}): Community chat with the maker.
- [License](${GITHUB}/blob/main/LICENSE): AGPL-3.0.
`;

export const GET: RequestHandler = () => {
	return new Response(CONTENT, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
