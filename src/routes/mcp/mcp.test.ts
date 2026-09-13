import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';

// Same boundary stubs as `api/v1/api-v1.test.ts`: server-only import ops pull
// `*.remote.ts` modules that vitest cannot load (never invoked in these tests).
vi.mock('$lib/features/recipes/modules/recipe-enrich/enrich-recipe.remote', () => ({
	enrichRawRecipe: () => Promise.reject(new Error('test stub')),
	enrichTextRecipe: () => Promise.reject(new Error('test stub'))
}));
vi.mock('$lib/features/recipes/modules/recipe-scrape/orchestrator.remote', () => ({
	scrapeRecipeUrl: () => Promise.reject(new Error('test stub'))
}));
vi.mock('$lib/features/ingredients/server/match-ingredients.remote', () => ({
	matchIngredientsRPC: () => Promise.reject(new Error('test stub'))
}));

import { registry } from '$lib/core/operations/registry.js';
import { OpError } from '$lib/core/operations/errors.js';
import {
	buildMcpTools,
	compactMcpOutput,
	defaultToolName,
	mcpErrorText,
	prepareMcpInput
} from '$lib/mcp/tools.js';

import { GET, POST } from './+server.js';

function postEvent(body: unknown, headers?: Record<string, string>): RequestEvent {
	return {
		request: new Request('http://localhost/mcp', {
			method: 'POST',
			headers: { 'content-type': 'application/json', ...headers },
			body: typeof body === 'string' ? body : JSON.stringify(body)
		}),
		url: new URL('http://localhost/mcp'),
		params: {}
	} as unknown as RequestEvent;
}

async function rpc(body: unknown, headers?: Record<string, string>) {
	const res = await POST(postEvent(body, headers));
	return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe('framing', () => {
	it('GET → 405 with Allow: POST', async () => {
		const res = GET();
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST');
	});
	it('non-JSON body → -32700', async () => {
		const { status, json } = await rpc('this is not json');
		expect(status).toBe(400);
		expect(json.error).toMatchObject({ code: -32700 });
	});
	it('non-2.0 payload → -32600', async () => {
		const { status, json } = await rpc({ method: 'tools/list', id: 1 });
		expect(status).toBe(400);
		expect(json.error).toMatchObject({ code: -32600 });
	});
	it('unknown method → -32601', async () => {
		const { json } = await rpc({ jsonrpc: '2.0', id: 1, method: 'resources/list' });
		expect(json.error).toMatchObject({ code: -32601 });
	});
	it('notification (no id) → 202 empty', async () => {
		const res = await POST(postEvent({ jsonrpc: '2.0', method: 'notifications/initialized' }));
		expect(res.status).toBe(202);
	});
	it('initialize echoes the client protocol version + tool capability', async () => {
		const { json } = await rpc({
			jsonrpc: '2.0',
			id: 1,
			method: 'initialize',
			params: { protocolVersion: '2025-06-18' }
		});
		expect(json.result).toMatchObject({
			protocolVersion: '2025-06-18',
			capabilities: { tools: {} },
			serverInfo: { name: 'cuicuit' }
		});
	});
});

describe('buildMcpTools ↔ registry consistency', () => {
	const tools = buildMcpTools();
	const publicOps = [...registry].filter(([, d]) => !d.internal && d.docs.mcp !== false);

	it('one tool per public op (auth.* token ops excluded)', () => {
		expect(tools).toHaveLength(publicOps.length);
		expect(tools.find((t) => t.op.startsWith('auth.'))).toBeUndefined();
		const ops = new Set(tools.map((t) => t.op));
		for (const [name] of publicOps) expect(ops.has(name)).toBe(true);
	});
	it('tool names are valid, unique, and honor overrides', () => {
		const names = tools.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
		for (const n of names) expect(n).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
		expect(tools.find((t) => t.op === 'plans.add-item')?.name).toBe('shopping_add');
		expect(tools.find((t) => t.op === 'plans.check-item')?.name).toBe('shopping_check');
		expect(tools.find((t) => t.op === 'billing.balance')?.name).toBe('seeds_balance');
		expect(defaultToolName('spaces.list')).toBe('spaces_list');
		expect(defaultToolName('plans.delete-item')).toBe('plans_delete_item');
		expect(defaultToolName('profile.complete-onboarding')).toBe('profile_complete_onboarding');
	});
	it('explicit overrides survive the snake_case default', () => {
		const tools = buildMcpTools();
		expect(tools.find((t) => t.op === 'plans.add-item')?.name).toBe('shopping_add');
		expect(tools.find((t) => t.op === 'plans.list-meals')?.name).toBe('plan_list');
	});
	it('every public op documents title + description', () => {
		for (const [name, def] of publicOps) {
			expect(def.docs.title.trim().length, `${name} title`).toBeGreaterThan(0);
			expect(def.docs.description.trim().length, `${name} description`).toBeGreaterThan(0);
		}
	});
	it('annotations follow kind (read-only vs destructive)', () => {
		const balance = tools.find((t) => t.op === 'billing.balance');
		expect(balance?.annotations).toMatchObject({
			readOnlyHint: true,
			destructiveHint: false,
			openWorldHint: false
		});
		const add = tools.find((t) => t.op === 'plans.add-item');
		expect(add?.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
	});
	it('identity fields are stripped from the exposed schema', () => {
		const add = tools.find((t) => t.op === 'plans.add-item');
		const props = (add?.inputSchema as { properties: Record<string, unknown> }).properties;
		expect(props.createdBy).toBeUndefined();
		expect(props.spaceId).toBeDefined();
		expect(props.name).toBeDefined();
	});
});

describe('prepareMcpInput', () => {
	it('injects createdBy from the credential, overwriting agent input', () => {
		expect(
			prepareMcpInput('plans.add-item', 'user-1', { spaceId: 's', createdBy: 'evil' })
		).toEqual({
			spaceId: 's',
			createdBy: 'user-1'
		});
	});
	it('leaves ops without identity fields untouched', () => {
		const args = { itemId: 'i', checked: true };
		expect(prepareMcpInput('plans.check-item', 'user-1', args)).toBe(args);
	});
	it('passes non-objects through', () => {
		expect(prepareMcpInput('plans.add-item', 'user-1', undefined)).toBeUndefined();
	});
});

describe('tools/call auth', () => {
	it('unknown tool → -32602 without needing credentials', async () => {
		const { json } = await rpc({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { name: 'nope_not_a_tool' }
		});
		expect(json.error).toMatchObject({ code: -32602 });
	});
	it('missing credential → HTTP 401', async () => {
		const { status, json } = await rpc({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { name: 'seeds_balance', arguments: {} }
		});
		expect(status).toBe(401);
		expect(json.error).toMatchObject({ code: -32000 });
	});
	it('tools/list works pre-auth', async () => {
		const { status, json } = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		expect(status).toBe(200);
		const tools = (json.result as { tools: unknown[] }).tools;
		expect(tools.length).toBe(buildMcpTools().length);
	});
	it('exposes languages_list', async () => {
		const { json } = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
		const tools = (json.result as { tools: { name: string }[] }).tools;
		expect(tools.some((t) => t.name === 'languages_list')).toBe(true);
	});
});

describe('mcpErrorText', () => {
	it('RLS-flavored INTERNAL → FORBIDDEN with a permission hint', () => {
		const text = mcpErrorText(
			new OpError('INTERNAL', 'Failed to add recipe to plan.', {
				message: 'new row violates row-level security policy for table "space_meals"'
			})
		);
		expect(text.startsWith('FORBIDDEN:')).toBe(true);
		expect(text).toContain('spaces_list');
	});
	it('plain INTERNAL passes through with its code', () => {
		expect(mcpErrorText(new OpError('INTERNAL', 'DB exploded.'))).toBe('INTERNAL: DB exploded.');
	});
	it('other OpErrors keep code + message', () => {
		expect(mcpErrorText(new OpError('NOT_FOUND', 'Nope.'))).toBe('NOT_FOUND: Nope.');
	});
});

describe('compactMcpOutput', () => {
	it('strips verbose keys recursively, keeps the rest', () => {
		const input = {
			id: 'm1',
			embedding: [0.1, 0.2],
			author_profile: { user_id: 'u1' },
			shopping_ingredients: [
				{ id: 'i1', name: 'Milk', hierarchy: ['a'], unit_frequencies: { l: 3 } }
			],
			recipe: { id: 'r1', fts: 'xyz', title: 'Soup' }
		};
		expect(compactMcpOutput(input)).toEqual({
			id: 'm1',
			shopping_ingredients: [{ id: 'i1', name: 'Milk' }],
			recipe: { id: 'r1', title: 'Soup' }
		});
	});
	it('passes scalars and empty structures through', () => {
		expect(compactMcpOutput(null)).toBeNull();
		expect(compactMcpOutput(42)).toBe(42);
		expect(compactMcpOutput([])).toEqual([]);
	});
});
