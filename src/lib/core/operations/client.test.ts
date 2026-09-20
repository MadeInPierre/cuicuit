import { describe, expect, it } from 'vitest';

import './client.js';
import { OpError } from './errors.js';
import { registry, runOp, type OpCtx } from './registry.js';

// Every op the browser UI may call must be registered by the client module.
const CLIENT_OPS = [
	'billing.balance',
	'billing.logs',
	'ingredients.list',
	'ingredients.match',
	'ingredients.upload-image',
	'plans.add-item',
	'plans.add-recipe',
	'plans.check-item',
	'plans.delete-item',
	'plans.delete-meal',
	'plans.list-items',
	'plans.list-meals',
	'plans.move-meal',
	'plans.recommendations',
	'plans.update-servings',
	'profile.complete-onboarding',
	'profile.delete-picture',
	'profile.get',
	'profile.update-aisle-order',
	'profile.update-avatar',
	'profile.update-preferences',
	'profile.update-profile',
	'profile.upload-picture',
	'recipes.create-draft',
	'recipes.delete-image',
	'recipes.delete',
	'recipes.edit',
	'recipes.get',
	'recipes.list',
	'recipes.upload-image',
	'spaces.create',
	'spaces.edit',
	'spaces.join',
	'spaces.leave',
	'spaces.list'
];

// Server-only ops must stay OUT of the browser bundle (their modules pull
// `$app/server`, `$env/static/private`, `stripe`, …).
// Admin ingredient ops are server-only too (they need `ctx.admin`): the admin
// UI calls them through `*.remote.ts`, never via `runOp` + `getClientCtx`.
const SERVER_ONLY_OPS = [
	'billing.checkout',
	'billing.consume',
	'ingredients.add-substitution',
	'ingredients.create',
	'ingredients.delete-image-candidate',
	'ingredients.delete-translation',
	'ingredients.generate-image',
	'ingredients.get',
	'ingredients.list-custom',
	'ingredients.list-image-candidates',
	'ingredients.promote-image',
	'ingredients.relink-custom',
	'ingredients.remove-substitution',
	'ingredients.update',
	'ingredients.update-substitution',
	'ingredients.upsert-translation',
	'recipes.add-examples',
	'recipes.import-from-text',
	'recipes.import-from-url'
];

describe('client operations registration', () => {
	it('registers every client-callable op', () => {
		for (const name of CLIENT_OPS) {
			expect(registry.has(name), `op not registered: ${name}`).toBe(true);
		}
	});

	it('does not pull server-only ops into the client bundle', () => {
		for (const name of SERVER_ONLY_OPS) {
			expect(registry.has(name), `server-only op leaked to client: ${name}`).toBe(false);
		}
	});

	it('throws NOT_FOUND for unknown operations', async () => {
		await expect(
			runOp('nope.missing', { supabase: null as unknown as OpCtx['supabase'], userId: 'x', source: 'app' }, {})
		).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });
		expect(OpError).toBeDefined();
	});
});
