import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError, z } from 'zod';

// Server-only import ops pull `*.remote.ts` modules (LLM/scrape/RPC
// implementations), which SvelteKit transforms in a way vitest cannot load.
// Stub the three remote modules at the boundary (never invoked in these tests).
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

import { decodeJwt, decodeProtectedHeader, exportJWK, generateKeyPair, jwtVerify } from 'jose';

import { signPatJwt } from '$lib/core/operations/auth.js';
import { OpError } from '$lib/core/operations/errors.js';
import { registry } from '$lib/core/operations/registry.js';

// `$env/dynamic/private` snapshots the real `.env` at load, so ambient keys
// (e.g. a locally configured PAT signing key) would leak into tests —
// redirect it at a mutable holder we control per test.
// `vi.hoisted` because `vi.mock` factories run before this declaration, and
// core scrape helpers read `$env/dynamic/private` at import time.
const patEnvHolder: { keyJson?: string } = vi.hoisted<{ keyJson?: string }>(() => ({}));
vi.mock('$env/dynamic/private', () => ({
	get env() {
		return patEnvHolder.keyJson === undefined
			? {}
			: { SUPABASE_PAT_JWT_PRIVATE_KEY: patEnvHolder.keyJson };
	}
}));

import { generatePat, hashPat, isPatFormat } from '$lib/core/operations/auth/pats.js';
import { queryParam, readJson, toResponse } from './_lib.js';
import { API_ROUTES, buildOpenApiDoc } from './openapi.js';

function fakeEvent(body?: string): RequestEvent {
	return {
		request: new Request('http://localhost/api/v1/x', { method: 'POST', body }),
		url: new URL('http://localhost/api/v1/x'),
		params: {}
	} as unknown as RequestEvent;
}

describe('toResponse error mapping', () => {
	const cases: Array<[string, number]> = [
		['UNAUTHENTICATED', 401],
		['FORBIDDEN', 403],
		['NOT_FOUND', 404],
		['INSUFFICIENT_SEEDS', 402],
		['VALIDATION', 400],
		['CONFLICT', 409],
		['INTERNAL', 500]
	];
	for (const [code, status] of cases) {
		it(`${code} → ${status}`, async () => {
			const res = toResponse(new OpError(code as never, 'msg'));
			expect(res.status).toBe(status);
			expect(await res.json()).toEqual({ error: { code, message: 'msg' } });
		});
	}
	it('ZodError → 400 with issues', async () => {
		const failing = z.object({ a: z.string() }).safeParse({});
		expect(failing.success).toBe(false);
		const res = toResponse(
			failing.success ? new Error('unreachable') : new ZodError(failing.error.issues)
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.code).toBe('VALIDATION');
	});
	it('unknown error → 500 without leaking', async () => {
		const res = toResponse(new Error('db exploded: secret'));
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({
			error: { code: 'INTERNAL', message: 'Unexpected server error.' }
		});
	});
});

describe('API_ROUTES ↔ registry consistency', () => {
	it('every routed op is registered and public (not internal)', () => {
		for (const route of API_ROUTES) {
			if (!route.op) continue;
			const def = registry.get(route.op);
			expect(def, `route ${route.method} ${route.path} → ${route.op}`).toBeDefined();
			expect(def?.internal, `${route.op} is internal but routed`).not.toBe(true);
		}
	});
	it('every public op is reachable; internal ops are not routed', () => {
		// Ops reachable only through a discriminated route (`op: null` entry):
		// PATCH /spaces/{id}/meals/{mealId} dispatches on the body shape.
		const coveredIndirectly = new Set(['plans.move-meal', 'plans.update-servings']);
		const routed = new Set(API_ROUTES.map((r) => r.op).filter((o): o is string => !!o));
		for (const [name, def] of registry) {
			if (def.internal) {
				expect(routed.has(name), `${name} is internal but routed`).toBe(false);
			} else if (!coveredIndirectly.has(name)) {
				expect(routed.has(name), `${name} is public but has no route`).toBe(true);
			} else {
				expect(def.internal ?? false).toBe(false);
			}
		}
	});
	it('all paths are under /api/v1', () => {
		for (const route of API_ROUTES) {
			expect(route.path.startsWith('/api/v1/')).toBe(true);
		}
	});
});

describe('buildOpenApiDoc', () => {
	const doc = buildOpenApiDoc('https://example.com') as {
		openapi: string;
		paths: Record<string, Record<string, { responses: Record<string, unknown>; summary: string }>>;
	};
	it('renders one operation per route entry', () => {
		expect(doc.openapi).toBe('3.1.0');
		const count = Object.values(doc.paths).reduce((n, item) => n + Object.keys(item).length, 0);
		expect(count).toBe(API_ROUTES.length);
	});
	it('every operation has a 200 response and a summary', () => {
		for (const [path, item] of Object.entries(doc.paths)) {
			for (const [method, op] of Object.entries(item)) {
				expect(op.responses['200'], `${method} ${path}`).toBeDefined();
				expect(op.summary.length, `${method} ${path}`).toBeGreaterThan(0);
			}
		}
	});
	it('request schemas derive from op zod inputs', () => {
		const docJson = JSON.stringify(doc);
		// recipes.list input fields must appear in the spec (proves toJSONSchema works).
		for (const field of ['lang', 'searchText', 'overlaps']) {
			expect(docJson.includes(field), `spec contains ${field}`).toBe(true);
		}
	});
});

describe('PAT helpers', () => {
	it('generatePat format + hash determinism', async () => {
		const { secret, prefix } = generatePat();
		expect(secret.startsWith('cui_')).toBe(true);
		expect(secret.startsWith(prefix)).toBe(true);
		expect(isPatFormat(secret)).toBe(true);
		expect(await hashPat(secret)).toBe(await hashPat(secret));
		expect(await hashPat(secret)).toMatch(/^[0-9a-f]{64}$/);
		expect(await hashPat(generatePat().secret)).not.toBe(await hashPat(secret));
	});
	it('isPatFormat rejects junk', () => {
		expect(isPatFormat('')).toBe(false);
		expect(isPatFormat('jwt.jwt.jwt')).toBe(false);
		expect(isPatFormat('cui_short')).toBe(false);
	});
});

describe('signPatJwt', () => {
	beforeEach(() => {
		patEnvHolder.keyJson = undefined;
	});
	async function ephemeralKey() {
		const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
		const jwk = await exportJWK(privateKey);
		jwk.kid = 'test-kid';
		// Mimic keys extracted from GOTRUE_JWT_KEYS, which carry key_ops that
		// WebCrypto rejects on private-key import (must be stripped).
		return {
			keyJson: JSON.stringify({ ...jwk, use: 'sig', key_ops: ['sign', 'verify'] }),
			publicKey
		};
	}

	it('mints a locally-verifiable ES256 JWT with sub/role/exp', async () => {
		const { keyJson, publicKey } = await ephemeralKey();
		const userId = '123e4567-e89b-12d3-a456-426614174000';
		const jwt = await signPatJwt(userId, keyJson);
		// Header carries the key id so PostgREST picks the right JWKS key.
		expect(decodeProtectedHeader(jwt)).toMatchObject({ alg: 'ES256', kid: 'test-kid' });
		// Claims PostgREST/RLS needs: sub = owner, role = authenticated.
		expect(decodeJwt(jwt)).toMatchObject({ sub: userId, role: 'authenticated' });
		// Signature verifies against the matching public key.
		const { payload } = await jwtVerify(jwt, publicKey);
		expect(payload.sub).toBe(userId);
	});
	it('falls back to the env key when no key is passed', async () => {
		const { keyJson } = await ephemeralKey();
		patEnvHolder.keyJson = keyJson;
		const jwt = await signPatJwt('123e4567-e89b-12d3-a456-426614174000');
		expect(decodeProtectedHeader(jwt)).toMatchObject({ alg: 'ES256', kid: 'test-kid' });
	});
	it('missing key → INTERNAL with an actionable message', async () => {
		await expect(signPatJwt('u')).rejects.toMatchObject({ code: 'INTERNAL' });
	});
	it('invalid JSON / non-EC key without `d` → INTERNAL', async () => {
		await expect(signPatJwt('u', 'not-json')).rejects.toMatchObject({ code: 'INTERNAL' });
		await expect(
			signPatJwt('u', JSON.stringify({ kty: 'EC', kid: 'x', x: 'y', y: 'z' }))
		).rejects.toMatchObject({ code: 'INTERNAL' });
	});
});

describe('readJson / queryParam', () => {
	it('empty body → {}', async () => {
		await expect(readJson(fakeEvent())).resolves.toEqual({});
	});
	it('parses objects, rejects arrays and garbage', async () => {
		await expect(readJson(fakeEvent('{"a":1}'))).resolves.toEqual({ a: 1 });
		await expect(readJson(fakeEvent('[1]'))).rejects.toThrowError(OpError);
		await expect(readJson(fakeEvent('nope'))).rejects.toThrowError(OpError);
	});
	it('queryParam required/optional', () => {
		const event = fakeEvent() as RequestEvent;
		expect(queryParam(event, 'missing')).toBeNull();
		expect(() => queryParam(event, 'missing', { required: true })).toThrowError(OpError);
		const withParam = {
			...event,
			url: new URL('http://localhost/api/v1/x?lang=en-US')
		} as RequestEvent;
		expect(queryParam(withParam, 'lang', { required: true })).toBe('en-US');
	});
});
