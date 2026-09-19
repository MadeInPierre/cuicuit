import { opInputJsonSchema as inputJsonSchema } from '$lib/core/operations/json-schema.js';
import { registry } from '$lib/core/operations/registry.js';
// Register every op so op docs/schemas are available to `buildOpenApiDoc()`
// (opInputJsonSchema/opDocs resolve from the registry at request time).
import '$lib/core/operations/index.js';

/**
 * Static route map: the single source of truth binding REST endpoints to ops.
 * `+server.ts` files implement this table; `buildOpenApiDoc()` below renders it
 * as OpenAPI 3.1 (served publicly at `/api/v1/openapi.json`).
 *
 * `query` lists accepted query params (hand-authored; op zod schemas validate
 * the merged input at runtime). `body: 'json' | 'multipart' | 'none'`. `tag`
 * groups endpoints into sidebar categories (see `TAGS` + `x-tagGroups` below).
 */
export interface ApiRouteEntry {
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	path: string;
	op: string | null;
	tag: string;
	summary: string;
	description?: string;
	query?: { name: string; required: boolean; type: 'string' | 'integer'; description: string }[];
	body?: 'json' | 'multipart' | 'none';
	sse?: boolean;
}

/** Endpoint categories, mirrored in the top-level `tags` + `x-tagGroups`. */
export const TAGS = {
	recipes: 'recipes',
	ingredients: 'ingredients',
	spaces: 'spaces',
	plan: 'plan',
	me: 'me',
	billing: 'billing',
	auth: 'auth'
} as const;

const q = (
	name: string,
	description: string,
	required = false,
	type: 'string' | 'integer' = 'string'
) => ({ name, required, type, description });

export const API_ROUTES: ApiRouteEntry[] = [
	// ---- Recipes ----
	{
		method: 'GET',
		path: '/api/v1/recipes',
		op: 'recipes.list',
		tag: TAGS.recipes,
		summary: 'List recipes',
		description:
			'`in`/`overlaps` accept URL-encoded JSON arrays of {column, values}; `or` accepts a PostgREST or-filter restricted to time columns.',
		query: [
			q('lang', 'Language code, e.g. en-US (required).', true),
			q('searchText', 'Accent-insensitive title search.'),
			q('limit', 'Max rows (1-500, default 100).', false, 'integer'),
			q('in', 'JSON array of {column, values} enum filters.'),
			q('overlaps', 'JSON array of {column, values} array filters.'),
			q('or', 'PostgREST or-filter on time columns.')
		]
	},
	{
		method: 'GET',
		path: '/api/v1/recipes/{id}',
		op: 'recipes.get',
		tag: TAGS.recipes,
		summary: 'Get one recipe',
		query: [q('lang', 'Language code, e.g. en-US (required).', true)]
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/draft',
		op: 'recipes.create-draft',
		tag: TAGS.recipes,
		summary: 'Create an empty draft recipe',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/recipes/{id}',
		op: 'recipes.edit',
		tag: TAGS.recipes,
		summary: 'Create/replace a recipe (upsert + ingredients)',
		description: 'Body is `{ data: <recipe form> }`; the id is taken from the path.',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/recipes/{id}',
		op: 'recipes.delete',
		tag: TAGS.recipes,
		summary: 'Soft-delete a recipe',
		description: 'Optional JSON body `{ restore, }` — use `POST .../restore` for restores.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/{id}/restore',
		op: 'recipes.delete',
		tag: TAGS.recipes,
		summary: 'Restore a soft-deleted recipe',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/{id}/image',
		op: 'recipes.upload-image',
		tag: TAGS.recipes,
		summary: 'Upload a recipe image',
		description: 'Multipart: `file` (image) + optional `currentImageIds` (JSON array).',
		body: 'multipart'
	},
	{
		method: 'DELETE',
		path: '/api/v1/recipes/{id}/image',
		op: 'recipes.delete-image',
		tag: TAGS.recipes,
		summary: 'Delete a recipe image',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/import-url',
		op: 'recipes.import-from-url',
		tag: TAGS.recipes,
		summary: 'Import a recipe from a URL (SSE, costs 1 seed)',
		description:
			'Streams progress numbers, then the final `{ id, isComplete, usage }`. Insufficient seeds → `event: error` with code INSUFFICIENT_SEEDS and no side effects.',
		body: 'json',
		sse: true
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/import-text',
		op: 'recipes.import-from-text',
		tag: TAGS.recipes,
		summary: 'Import a recipe from free text (SSE, costs 1 seed)',
		body: 'json',
		sse: true
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/examples',
		op: 'recipes.add-examples',
		tag: TAGS.recipes,
		summary: 'Import the curated example recipes (free)',
		body: 'json'
	},
	// ---- Ingredients ----
	{
		method: 'GET',
		path: '/api/v1/languages',
		op: 'languages.list',
		tag: TAGS.ingredients,
		summary: 'List supported languages (ids and codes)'
	},
	{
		method: 'GET',
		path: '/api/v1/ingredients',
		op: 'ingredients.list',
		tag: TAGS.ingredients,
		summary: 'Browse the ingredient catalog',
		query: [
			q('start', 'Range start (default 0).', false, 'integer'),
			q('end', 'Range end (default 1000).', false, 'integer')
		]
	},
	{
		method: 'POST',
		path: '/api/v1/ingredients/match',
		op: 'ingredients.match',
		tag: TAGS.ingredients,
		summary: 'Match free-text ingredient strings to the catalog',
		body: 'json'
	},
	// ---- Spaces ----
	{
		method: 'GET',
		path: '/api/v1/spaces',
		op: 'spaces.list',
		tag: TAGS.spaces,
		summary: 'List my spaces (with members)',
		description: 'Caller identity is forced from the credential; any `userId` sent is ignored.'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces',
		op: 'spaces.create',
		tag: TAGS.spaces,
		summary: 'Create a space',
		body: 'json'
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}',
		op: null,
		tag: TAGS.spaces,
		summary: 'Get one space (derived from spaces.list)',
		description: 'Thin derivation: runs `spaces.list` and picks the id (404 when absent).'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}',
		op: 'spaces.edit',
		tag: TAGS.spaces,
		summary: 'Edit a space',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}',
		op: 'spaces.leave',
		tag: TAGS.spaces,
		summary: 'Leave a space (remove myself)',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/join',
		op: 'spaces.join',
		tag: TAGS.spaces,
		summary: 'Join a space',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/leave',
		op: 'spaces.leave',
		tag: TAGS.spaces,
		summary: 'Leave a space (remove myself)',
		body: 'none'
	},
	// ---- Plan: meals ----
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/meals',
		op: 'plans.list-meals',
		tag: TAGS.plan,
		summary: 'List planned meals',
		query: [q('lang', 'Language code, e.g. en-US (required).', true)]
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/meals',
		op: 'plans.add-recipe',
		tag: TAGS.plan,
		summary: 'Add a recipe to the plan',
		description: '`spaceId` from path, `createdBy` forced from credential.',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}/meals/{mealId}',
		op: null,
		tag: TAGS.plan,
		summary: 'Rescale servings or move a meal',
		description:
			'Body with `servings` (+`recipeServings`, `ingredients`) → `plans.update-servings`; body with `position` → `plans.move-meal`. Both/neither → 400.',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}/meals/{mealId}',
		op: 'plans.delete-meal',
		tag: TAGS.plan,
		summary: 'Delete (or cook) a meal',
		description: 'Optional JSON body `{ undo, cooked }`; also accepted as query params.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/meals/{mealId}/restore',
		op: 'plans.delete-meal',
		tag: TAGS.plan,
		summary: 'Restore a deleted meal',
		body: 'none'
	},
	// ---- Plan: items ----
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/items',
		op: 'plans.list-items',
		tag: TAGS.plan,
		summary: 'List shopping items',
		query: [q('lang', 'Language code, e.g. en-US (required).', true)]
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/items',
		op: 'plans.add-item',
		tag: TAGS.plan,
		summary: 'Add a shopping item',
		description: '`spaceId` from path, `createdBy` forced from credential.',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}/items/{itemId}',
		op: 'plans.check-item',
		tag: TAGS.plan,
		summary: 'Check/uncheck a shopping item',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}/items/{itemId}',
		op: 'plans.delete-item',
		tag: TAGS.plan,
		summary: 'Delete a shopping item',
		description: 'Optional JSON body `{ deleted, undo }`; also accepted as query params.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/items/{itemId}/restore',
		op: 'plans.delete-item',
		tag: TAGS.plan,
		summary: 'Restore a deleted shopping item',
		body: 'none'
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/shopping-list',
		op: null,
		tag: TAGS.plan,
		summary: 'Combined shopping list (derived)',
		description:
			'Runs `plans.list-meals` + `plans.list-items`, then the pure `generateShoppingList`. Returns `{ meals, items, combined }`.',
		query: [q('lang', 'Language code, e.g. en-US (required).', true)]
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/recommendations',
		op: 'plans.recommendations',
		tag: TAGS.plan,
		summary: 'Shopping recommendations (RPC)',
		query: [q('lang', 'Language code, e.g. en-US (required).', true)]
	},
	// ---- Me / profile ----
	{
		method: 'GET',
		path: '/api/v1/me',
		op: 'profile.get',
		tag: TAGS.me,
		summary: 'Get my profile + preferences'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me',
		op: 'profile.update-profile',
		tag: TAGS.me,
		summary: 'Update my display profile',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/preferences',
		op: 'profile.update-preferences',
		tag: TAGS.me,
		summary: 'Update my preferences',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/aisle-order',
		op: 'profile.update-aisle-order',
		tag: TAGS.me,
		summary: 'Update my supermarket aisle order',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/avatar',
		op: 'profile.update-avatar',
		tag: TAGS.me,
		summary: 'Update my avatar (icon or image URL)',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/me/picture',
		op: 'profile.upload-picture',
		tag: TAGS.me,
		summary: 'Upload my profile picture',
		description: 'Multipart: `file` (image ≤5 MB).',
		body: 'multipart'
	},
	{
		method: 'DELETE',
		path: '/api/v1/me/picture',
		op: 'profile.delete-picture',
		tag: TAGS.me,
		summary: 'Delete my profile picture',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/me/onboarding',
		op: 'profile.complete-onboarding',
		tag: TAGS.me,
		summary: 'Complete onboarding (profile + preferences + space language)',
		body: 'json'
	},
	// ---- Billing ----
	{
		method: 'GET',
		path: '/api/v1/me/seeds',
		op: 'billing.balance',
		tag: TAGS.billing,
		summary: 'Seed balance + community pool health'
	},
	{
		method: 'GET',
		path: '/api/v1/me/seeds/logs',
		op: 'billing.logs',
		tag: TAGS.billing,
		summary: 'Seed ledger, newest first',
		query: [q('limit', 'Max rows (default 100).', false, 'integer')]
	},
	{
		method: 'POST',
		path: '/api/v1/billing/checkout',
		op: 'billing.checkout',
		tag: TAGS.billing,
		summary: 'Create a Stripe checkout session',
		description: '`origin` is derived from the request URL (adapter-injected, like the remote).',
		body: 'json'
	},
	// ---- Auth tokens (JWT-only) ----
	{
		method: 'GET',
		path: '/api/v1/auth/tokens',
		op: 'auth.list-tokens',
		tag: TAGS.auth,
		summary: 'List my API tokens (JWT only)'
	},
	{
		method: 'POST',
		path: '/api/v1/auth/tokens',
		op: 'auth.create-token',
		tag: TAGS.auth,
		summary: 'Create an API token (JWT only, secret shown once)',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/auth/tokens/{id}',
		op: 'auth.revoke-token',
		tag: TAGS.auth,
		summary: 'Revoke an API token (JWT only)',
		body: 'none'
	}
];

const ERROR_SCHEMA = {
	type: 'object',
	required: ['error'],
	properties: {
		error: {
			type: 'object',
			required: ['code', 'message'],
			properties: { code: { type: 'string' }, message: { type: 'string' } }
		}
	}
};

/**
 * Presentation metadata for an op, straight from the registry
 * (`OpDef.docs`) so OpenAPI and MCP surface identical text. Never throws:
 * falls back to empty values when the op is unknown or not registered yet.
 */
function opDocs(op: string | null): { title?: string; description?: string; hints: string[] } {
	if (!op) return { hints: [] };
	const def = registry.get(op);
	if (!def) return { hints: [] };
	return { title: def.docs.title, description: def.docs.description, hints: def.docs.hints ?? [] };
}

/** Tag intro derived from the titles of its operations — never hand-maintained. */
function tagDescription(tag: string): string {
	const titles = [
		...new Set(
			API_ROUTES.filter((r) => r.tag === tag && r.op)
				.map((r) => opDocs(r.op).title)
				.filter((t): t is string => !!t)
		)
	];
	return titles.length ? `${titles.join(' · ')}.` : '';
}

/** Build the public OpenAPI 3.1 document from `API_ROUTES` + op zod schemas. */
export function buildOpenApiDoc(baseUrl: string): Record<string, unknown> {
	const paths: Record<string, unknown> = {};
	for (const route of API_ROUTES) {
		const item = (paths[route.path] ??= {}) as Record<string, unknown>;
		const docs = opDocs(route.op);
		const operation: Record<string, unknown> = {
			operationId:
				route.op ?? `${route.method.toLowerCase()}_${route.path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
			tags: [route.tag],
			summary: route.summary,
			security: [{ bearerAuth: [] }],
			responses: {
				'200': { description: 'OK' },
				'400': {
					description: 'Invalid input',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				},
				'401': {
					description: 'Missing/invalid credentials',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				},
				'402': {
					description: 'Insufficient seeds',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				},
				'403': {
					description: 'Forbidden',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				},
				'404': {
					description: 'Not found',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				}
			}
		};
		const description = [route.description, docs.description, ...docs.hints]
			.filter((d): d is string => !!d)
			.join('\n\n');
		if (description) operation.description = description;
		if (route.query?.length) {
			operation.parameters = route.query.map((p) => ({
				name: p.name,
				in: 'query',
				required: p.required,
				description: p.description,
				schema: { type: p.type === 'integer' ? 'integer' : 'string' }
			}));
		}
		if (route.sse) {
			operation.responses = {
				'200': {
					description:
						'Progress frames (`data: <json>`) then final result; failures arrive as `event: error`.',
					content: { 'text/event-stream': { schema: { type: 'string' } } }
				},
				'401': {
					description: 'Missing/invalid credentials',
					content: { 'application/json': { schema: ERROR_SCHEMA } }
				}
			};
		} else if (route.body === 'json') {
			operation.requestBody = {
				required: true,
				content: {
					'application/json': { schema: route.op ? inputJsonSchema(route.op) : { type: 'object' } }
				}
			};
		} else if (route.body === 'multipart') {
			operation.requestBody = {
				required: true,
				content: {
					'multipart/form-data': {
						schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } }
					}
				}
			};
		}
		item[route.method.toLowerCase()] = operation;
	}
	return {
		openapi: '3.1.0',
		info: {
			title: 'Cuicuit API',
			version: '1.0.0',
			description:
				'Cuicuit REST API v1 — every database operation, scriptable with curl or a CLI. ' +
				'Authenticate with `Authorization: Bearer <supabaseJWT|cui_...>`; ' +
				'Personal Access Tokens are managed at `/api/v1/auth/tokens` (JWT only).'
		},
		servers: [{ url: `${baseUrl}/api/v1` }],
		tags: [
			{ name: TAGS.recipes, 'x-displayName': 'Recipes', description: tagDescription(TAGS.recipes) },
			{
				name: TAGS.ingredients,
				'x-displayName': 'Ingredients & languages',
				description: tagDescription(TAGS.ingredients)
			},
			{ name: TAGS.spaces, 'x-displayName': 'Spaces', description: tagDescription(TAGS.spaces) },
			{
				name: TAGS.plan,
				'x-displayName': 'Plan & shopping',
				description: tagDescription(TAGS.plan)
			},
			{ name: TAGS.me, 'x-displayName': 'Me / profile', description: tagDescription(TAGS.me) },
			{
				name: TAGS.billing,
				'x-displayName': 'Balance & billing',
				description: tagDescription(TAGS.billing)
			},
			{ name: TAGS.auth, 'x-displayName': 'Auth tokens', description: tagDescription(TAGS.auth) }
		],
		'x-tagGroups': [
			{ name: 'Cook', tags: [TAGS.recipes, TAGS.ingredients] },
			{ name: 'Plan', tags: [TAGS.spaces, TAGS.plan] },
			{ name: 'Account', tags: [TAGS.me, TAGS.billing, TAGS.auth] }
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					description: 'Supabase user JWT or Personal Access Token (`cui_...`).'
				}
			}
		},
		paths
	};
}
