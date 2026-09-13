import { opInputJsonSchema as inputJsonSchema } from '$lib/core/operations/json-schema.js';

/**
 * Static route map: the single source of truth binding REST endpoints to ops.
 * `+server.ts` files implement this table; `buildOpenApiDoc()` below renders it
 * as OpenAPI 3.1 (served publicly at `/api/v1/openapi.json`).
 *
 * `query` lists accepted query params (hand-authored; op zod schemas validate
 * the merged input at runtime). `body: 'json' | 'multipart' | 'none'`.
 */
export interface ApiRouteEntry {
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	path: string;
	op: string | null;
	summary: string;
	description?: string;
	query?: { name: string; required: boolean; type: 'string' | 'integer'; description: string }[];
	body?: 'json' | 'multipart' | 'none';
	sse?: boolean;
}

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
		summary: 'List recipes',
		description:
			'`in`/`overlaps` accept URL-encoded JSON arrays of {column, values}; `or` accepts a PostgREST or-filter restricted to time columns.',
		query: [
			q('languageId', 'Language id (required).', true, 'integer'),
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
		summary: 'Get one recipe',
		query: [q('languageId', 'Language id (required).', true, 'integer')]
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/draft',
		op: 'recipes.create-draft',
		summary: 'Create an empty draft recipe',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/recipes/{id}',
		op: 'recipes.edit',
		summary: 'Create/replace a recipe (upsert + ingredients)',
		description: 'Body is `{ data: <recipe form> }`; the id is taken from the path.',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/recipes/{id}',
		op: 'recipes.delete',
		summary: 'Soft-delete a recipe',
		description: 'Optional JSON body `{ restore, }` — use `POST .../restore` for restores.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/{id}/restore',
		op: 'recipes.delete',
		summary: 'Restore a soft-deleted recipe',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/{id}/image',
		op: 'recipes.upload-image',
		summary: 'Upload a recipe image',
		description: 'Multipart: `file` (image) + optional `currentImageIds` (JSON array).',
		body: 'multipart'
	},
	{
		method: 'DELETE',
		path: '/api/v1/recipes/{id}/image',
		op: 'recipes.delete-image',
		summary: 'Delete a recipe image',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/import-url',
		op: 'recipes.import-from-url',
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
		summary: 'Import a recipe from free text (SSE, costs 1 seed)',
		body: 'json',
		sse: true
	},
	{
		method: 'POST',
		path: '/api/v1/recipes/examples',
		op: 'recipes.add-examples',
		summary: 'Import the curated example recipes (free)',
		body: 'json'
	},
	// ---- Ingredients ----
	{
		method: 'GET',
		path: '/api/v1/languages',
		op: 'languages.list',
		summary: 'List supported languages (ids and codes)'
	},
	{
		method: 'GET',
		path: '/api/v1/ingredients',
		op: 'ingredients.list',
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
		summary: 'Match free-text ingredient strings to the catalog',
		body: 'json'
	},
	// ---- Spaces ----
	{
		method: 'GET',
		path: '/api/v1/spaces',
		op: 'spaces.list',
		summary: 'List my spaces (with members)',
		description: 'Caller identity is forced from the credential; any `userId` sent is ignored.'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces',
		op: 'spaces.create',
		summary: 'Create a space',
		body: 'json'
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}',
		op: null,
		summary: 'Get one space (derived from spaces.list)',
		description: 'Thin derivation: runs `spaces.list` and picks the id (404 when absent).'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}',
		op: 'spaces.edit',
		summary: 'Edit a space',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}',
		op: 'spaces.leave',
		summary: 'Leave a space (remove myself)',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/join',
		op: 'spaces.join',
		summary: 'Join a space',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/leave',
		op: 'spaces.leave',
		summary: 'Leave a space (remove myself)',
		body: 'none'
	},
	// ---- Plan: meals ----
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/meals',
		op: 'plans.list-meals',
		summary: 'List planned meals',
		query: [q('languageId', 'Language id (required).', true, 'integer')]
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/meals',
		op: 'plans.add-recipe',
		summary: 'Add a recipe to the plan',
		description: '`spaceId` from path, `createdBy` forced from credential.',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}/meals/{mealId}',
		op: null,
		summary: 'Rescale servings or move a meal',
		description:
			'Body with `servings` (+`recipeServings`, `ingredients`) → `plans.update-servings`; body with `position` → `plans.move-meal`. Both/neither → 400.',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}/meals/{mealId}',
		op: 'plans.delete-meal',
		summary: 'Delete (or cook) a meal',
		description: 'Optional JSON body `{ undo, cooked }`; also accepted as query params.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/meals/{mealId}/restore',
		op: 'plans.delete-meal',
		summary: 'Restore a deleted meal',
		body: 'none'
	},
	// ---- Plan: items ----
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/items',
		op: 'plans.list-items',
		summary: 'List shopping items',
		query: [q('languageId', 'Language id (required).', true, 'integer')]
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/items',
		op: 'plans.add-item',
		summary: 'Add a shopping item',
		description: '`spaceId` from path, `createdBy` forced from credential.',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/spaces/{id}/items/{itemId}',
		op: 'plans.check-item',
		summary: 'Check/uncheck a shopping item',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/spaces/{id}/items/{itemId}',
		op: 'plans.delete-item',
		summary: 'Delete a shopping item',
		description: 'Optional JSON body `{ deleted, undo }`; also accepted as query params.',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/spaces/{id}/items/{itemId}/restore',
		op: 'plans.delete-item',
		summary: 'Restore a deleted shopping item',
		body: 'none'
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/shopping-list',
		op: null,
		summary: 'Combined shopping list (derived)',
		description:
			'Runs `plans.list-meals` + `plans.list-items`, then the pure `generateShoppingList`. Returns `{ meals, items, combined }`.',
		query: [q('languageId', 'Language id (required).', true, 'integer')]
	},
	{
		method: 'GET',
		path: '/api/v1/spaces/{id}/recommendations',
		op: 'plans.recommendations',
		summary: 'Shopping recommendations (RPC)',
		query: [q('lang', 'Language key, e.g. en (required).', true)]
	},
	// ---- Me / profile ----
	{ method: 'GET', path: '/api/v1/me', op: 'profile.get', summary: 'Get my profile + preferences' },
	{
		method: 'PATCH',
		path: '/api/v1/me',
		op: 'profile.update-profile',
		summary: 'Update my display profile',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/preferences',
		op: 'profile.update-preferences',
		summary: 'Update my preferences',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/aisle-order',
		op: 'profile.update-aisle-order',
		summary: 'Update my supermarket aisle order',
		body: 'json'
	},
	{
		method: 'PATCH',
		path: '/api/v1/me/avatar',
		op: 'profile.update-avatar',
		summary: 'Update my avatar (icon or image URL)',
		body: 'json'
	},
	{
		method: 'POST',
		path: '/api/v1/me/picture',
		op: 'profile.upload-picture',
		summary: 'Upload my profile picture',
		description: 'Multipart: `file` (image ≤5 MB).',
		body: 'multipart'
	},
	{
		method: 'DELETE',
		path: '/api/v1/me/picture',
		op: 'profile.delete-picture',
		summary: 'Delete my profile picture',
		body: 'none'
	},
	{
		method: 'POST',
		path: '/api/v1/me/onboarding',
		op: 'profile.complete-onboarding',
		summary: 'Complete onboarding (profile + preferences + space language)',
		body: 'json'
	},
	{
		method: 'GET',
		path: '/api/v1/me/seeds',
		op: 'billing.balance',
		summary: 'Seed balance + community pool health'
	},
	{
		method: 'GET',
		path: '/api/v1/me/seeds/logs',
		op: 'billing.logs',
		summary: 'Seed ledger, newest first',
		query: [q('limit', 'Max rows (default 100).', false, 'integer')]
	},
	// ---- Billing ----
	{
		method: 'POST',
		path: '/api/v1/billing/checkout',
		op: 'billing.checkout',
		summary: 'Create a Stripe checkout session',
		description: '`origin` is derived from the request URL (adapter-injected, like the remote).',
		body: 'json'
	},
	// ---- Auth tokens (JWT-only) ----
	{
		method: 'GET',
		path: '/api/v1/auth/tokens',
		op: 'auth.list-tokens',
		summary: 'List my API tokens (JWT only)'
	},
	{
		method: 'POST',
		path: '/api/v1/auth/tokens',
		op: 'auth.create-token',
		summary: 'Create an API token (JWT only, secret shown once)',
		body: 'json'
	},
	{
		method: 'DELETE',
		path: '/api/v1/auth/tokens/{id}',
		op: 'auth.revoke-token',
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

/** Build the public OpenAPI 3.1 document from `API_ROUTES` + op zod schemas. */
export function buildOpenApiDoc(baseUrl: string): Record<string, unknown> {
	const paths: Record<string, unknown> = {};
	for (const route of API_ROUTES) {
		const item = (paths[route.path] ??= {}) as Record<string, unknown>;
		const operation: Record<string, unknown> = {
			operationId:
				route.op ?? `${route.method.toLowerCase()}_${route.path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
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
		if (route.description) operation.description = route.description;
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
