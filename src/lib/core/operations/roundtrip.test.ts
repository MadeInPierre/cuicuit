import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

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
// `canAfford` reads the local DB's real seed pool (donated seeds are present),
// which would make the import op affordable and hit a real LLM. Stub it to
// `false` so the INSUFFICIENT_SEEDS (402) path is exercised deterministically.
// Only the two import ops import `credits.js`; nothing else here needs it.
vi.mock('./credits.js', () => ({
	canAfford: async () => false
}));

import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

import type { Database } from '$lib/shared/db/supabase.types';

import { resolvePatToken } from './auth.js';
import './index.js';
import { runOp, runOpStream, type OpCtx } from './registry.js';

/**
 * DB-backed round-trips: one `runOp` per public op against local Supabase.
 *
 * This is the suite that makes the core "never break by surprise" — it pins
 * registration, RLS scoping, credit gating, input whitelists and undo
 * semantics end to end. Run with local Supabase up (`npm run db:start`);
 * without it (or without `SUPABASE_SECRET_KEY`) the suite skips cleanly so
 * `npm run test:unit` stays green everywhere.
 *
 * Test users are unique per run (`roundtrip-<run>-a/b@example.com`) because
 * local GoTrue `admin.deleteUser` 500s — auth rows accumulate (~2 per run,
 * harmless locally). Every DATA row the suite creates (spaces, meals, items,
 * recipes, tokens, storage files) is deleted in `afterAll`, scoped to the
 * run's ids — never touch another row: local DBs hold real dev data.
 */

const SECRET = env.SUPABASE_SECRET_KEY;
const PASSWORD = 'roundtrip-test-password';
const RUN = Date.now().toString(36);

type TestUser = { id: string; ctx: OpCtx };

function userClient(token: string): SupabaseClient<Database> {
	return createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
}

async function setupDb(): Promise<{ admin: SupabaseClient<Database>; a: TestUser; b: TestUser }> {
	if (!SECRET) throw new Error('missing SUPABASE_SECRET_KEY');
	const admin = createClient<Database>(PUBLIC_SUPABASE_URL, SECRET);
	// Connectivity probe — throws when local Supabase is down.
	const { error: probeError } = await admin.from('languages').select('id').limit(1);
	if (probeError) throw new Error(`supabase unreachable: ${probeError.message}`);

	async function ensureUser(tag: 'a' | 'b'): Promise<TestUser> {
		const email = `roundtrip-${RUN}-${tag}@example.com`;
		const pub = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
			auth: { persistSession: false, autoRefreshToken: false }
		});
		let userId: string | undefined;
		const { data: signedIn, error: signInError } = await pub.auth.signInWithPassword({
			email,
			password: PASSWORD
		});
		if (signInError) {
			const { data: created, error: createError } = await admin.auth.admin.createUser({
				email,
				password: PASSWORD,
				email_confirm: true
			});
			if (createError || !created.user) throw new Error(`createUser: ${createError?.message}`);
			userId = created.user.id;
			const { data: fresh, error: freshError } = await pub.auth.signInWithPassword({
				email,
				password: PASSWORD
			});
			if (freshError || !fresh.session) throw new Error(`signIn: ${freshError?.message}`);
			const ctx: OpCtx = {
				supabase: userClient(fresh.session.access_token),
				admin,
				userId,
				source: 'app'
			};
			return { id: userId, ctx };
		}
		userId = signedIn.user.id;
		const ctx: OpCtx = {
			supabase: userClient(signedIn.session.access_token),
			admin,
			userId,
			source: 'app'
		};
		return { id: userId, ctx };
	}

	const [a, b] = await Promise.all([ensureUser('a'), ensureUser('b')]);
	return { admin, a, b };
}

const dbResult:
	| { ok: false; error: unknown }
	| { admin: SupabaseClient<Database>; a: TestUser; b: TestUser } = await setupDb().catch(
	(error: unknown) => ({ ok: false as const, error })
);

if ('ok' in dbResult) {
	const reason = dbResult.error instanceof Error ? dbResult.error.message : String(dbResult.error);
	console.warn(`[roundtrip] skipping DB suite: ${reason}`);
	describe.skip('core round-trips (local supabase unavailable)', () => {
		it('placeholder', () => {
			expect(true).toBe(true);
		});
	});
} else {
	const { admin, a, b } = dbResult;
	const spaceIds: string[] = [];
	const recipeIds: string[] = [];
	const files: Array<{ bucket: string; path: string }> = [];

	afterAll(async () => {
		// Best-effort, FK-safe order, strictly scoped to this run's ids.
		for (const f of files) {
			await admin.storage.from(f.bucket).remove([f.path]);
		}
		if (spaceIds.length > 0) {
			await admin.from('space_items').delete().in('space_id', spaceIds);
			await admin.from('space_meals').delete().in('space_id', spaceIds);
			await admin.from('space_members').delete().in('space_id', spaceIds);
			await admin.from('spaces').delete().in('id', spaceIds);
		}
		if (recipeIds.length > 0) {
			await admin.from('recipe_ingredients').delete().in('recipe_id', recipeIds);
			await admin.from('recipes').delete().in('id', recipeIds);
		}
		await admin.from('user_api_tokens').delete().in('user_id', [a.id, b.id]);
	});

	const LANG = 'en-US';
	const USERNAME = `rt_${RUN}`;

	describe('core round-trips (local supabase)', () => {
		let spaceA = '';
		let draftId = '';
		let recipeId = '';
		let itemId = '';
		let mealId = '';
		let tokenId = '';
		let tokenSecret = '';

		it('spaces.create → list → edit', async () => {
			spaceA = await runOp('spaces.create', a.ctx, {
				userId: a.id,
				name: `RT Space ${RUN}`,
				theme: 'default',
				icon: 'home',
				lang: LANG
			});
			expect(spaceA).toMatch(/^[0-9a-f-]{36}$/);
			spaceIds.push(spaceA);

			const spaces = (await runOp('spaces.list', a.ctx, { userId: a.id })) as Array<{
				id?: string;
				spaces?: { id: string; name: string } | null;
			}>;
			const mine = spaces.find((s) => s.id === spaceA || s.spaces?.id === spaceA);
			expect(mine, 'created space visible in list').toBeDefined();

			await runOp('spaces.edit', a.ctx, {
				spaceId: spaceA,
				userId: a.id,
				name: `RT Space ${RUN} renamed`,
				theme: 'default',
				icon: 'home',
				lang: LANG
			});
			const after = (await runOp('spaces.list', a.ctx, { userId: a.id })) as Array<{
				id?: string;
				spaces?: { id: string; name: string } | null;
				name?: string;
			}>;
			const renamed = after.find((s) => s.id === spaceA);
			expect(renamed?.name).toContain('renamed');
		});

		it('spaces.join → list → leave → cross-user edit is NOT_FOUND', async () => {
			await runOp('spaces.join', b.ctx, { userId: b.id, spaceId: spaceA, theme: 'default' });
			const joined = (await runOp('spaces.list', b.ctx, { userId: b.id })) as Array<{
				id?: string;
				spaces?: { id: string } | null;
			}>;
			expect(joined.some((s) => s.id === spaceA || s.spaces?.id === spaceA)).toBe(true);

			await runOp('spaces.leave', b.ctx, { userId: b.id, spaceId: spaceA });
			const left = (await runOp('spaces.list', b.ctx, { userId: b.id })) as Array<{
				id?: string;
				spaces?: { id: string } | null;
			}>;
			expect(left.some((s) => s.id === spaceA || s.spaces?.id === spaceA)).toBe(false);

			// Phase 2 uniform: no membership → NOT_FOUND (never FORBIDDEN, never leak).
			await expect(
				runOp('spaces.edit', b.ctx, {
					spaceId: spaceA,
					userId: b.id,
					name: 'hijack',
					theme: 'default',
					icon: 'home',
					lang: LANG
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });
			await expect(
				runOp('spaces.edit', a.ctx, {
					spaceId: '00000000-0000-0000-0000-000000000000',
					userId: a.id,
					name: 'nope',
					theme: 'default',
					icon: 'home',
					lang: LANG
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });
		});

		it('profile.get → update-profile → update-preferences → get reflects', async () => {
			const before = (await runOp('profile.get', a.ctx, {
				userIds: [a.id],
				includePreferences: true
			})) as { profiles: Array<{ user_id: string; user_name: string }> };
			expect(before.profiles).toHaveLength(1);
			expect(before.profiles[0].user_id).toBe(a.id);

			await runOp('profile.update-profile', a.ctx, { userId: a.id, userName: USERNAME });
			await runOp('profile.update-preferences', a.ctx, {
				userId: a.id,
				firstName: 'Round',
				lastName: 'Trip'
			});
			const after = (await runOp('profile.get', a.ctx, {
				userIds: [a.id],
				includePreferences: true
			})) as {
				profiles: Array<{ user_name: string }>;
				preferences: { first_name: string; last_name: string } | null;
			};
			expect(after.profiles[0].user_name).toBe(USERNAME);
			expect(after.preferences).toMatchObject({ first_name: 'Round', last_name: 'Trip' });
		});

		it('profile.update-aisle-order → update-avatar → complete-onboarding', async () => {
			await runOp('profile.update-aisle-order', a.ctx, {
				userId: a.id,
				aisleOrder: ['produce', 'dairy']
			});
			const aisles = (await runOp('profile.get', a.ctx, {
				userIds: [a.id],
				includePreferences: true
			})) as { preferences: { aisle_order: string[] } | null };
			expect(aisles.preferences?.aisle_order).toEqual(['produce', 'dairy']);

			await runOp('profile.update-avatar', a.ctx, { userId: a.id, iconName: 'apple' });
			const avatar = (await runOp('profile.get', a.ctx, {
				userIds: [a.id],
				includePreferences: false
			})) as { profiles: Array<{ icon: string }> };
			expect(avatar.profiles[0].icon).toBe('apple');

			await runOp('profile.complete-onboarding', b.ctx, {
				userId: b.id,
				userName: `${USERNAME}b`,
				icon: 'carrot',
				firstName: 'Bee',
				lastName: 'User',
				lang: LANG
			});
			const done = (await runOp('profile.get', b.ctx, {
				userIds: [b.id],
				includePreferences: true
			})) as {
				profiles: Array<{ user_name: string }>;
				preferences: { onboarding_status: string } | null;
			};
			expect(done.profiles[0].user_name).toBe(`${USERNAME}b`);
			expect(done.preferences?.onboarding_status).toBe('finished');
		});

		it('profile.upload-picture → delete-picture (storage round-trip)', async () => {
			const url = await runOp('profile.upload-picture', a.ctx, {
				userId: a.id,
				file: new File(['avatar-bytes'], `rt-${RUN}.png`, { type: 'image/png' })
			});
			expect(typeof url).toBe('string');
			expect(url as string).toContain(`${a.id}/avatar.png`);
			files.push({ bucket: 'users', path: `public/${a.id}/avatar.png` });
			await runOp('profile.delete-picture', a.ctx, { userId: a.id });
			const cleared = (await runOp('profile.get', a.ctx, {
				userIds: [a.id],
				includePreferences: false
			})) as { profiles: Array<{ image_url: string | null }> };
			expect(cleared.profiles[0].image_url).toBeNull();
		});

		it('recipes.create-draft → get → list', async () => {
			draftId = await runOp('recipes.create-draft', a.ctx, {
				sourceType: 'user-manual',
				lang: LANG,
				title: `RT Draft ${RUN}`
			});
			expect(draftId).toMatch(/^[0-9a-f-]{36}$/);
			recipeIds.push(draftId);

			const draft = (await runOp('recipes.get', a.ctx, {
				recipeId: draftId,
				lang: LANG
			})) as { title: string };
			expect(draft.title).toBe(`RT Draft ${RUN}`);

			const listed = (await runOp('recipes.list', a.ctx, {
				lang: LANG,
				searchText: '',
				limit: 100,
				overlaps: [],
				in: [],
				or: null
			})) as Array<{ id: string }>;
			expect(listed.some((r) => r.id === draftId)).toBe(true);
		});

		it('recipes.edit create → update → delete → restore', async () => {
			const data = {
				lang: LANG,
				title: `RT Full ${RUN}`,
				short_title: `RT ${RUN}`,
				description: 'round-trip recipe',
				source_type: 'user-manual' as const,
				source_url: '',
				imageIds: [],
				effortLevel: 'low',
				skillLevel: 'beginner',
				cleanupLevel: 'low',
				costLevel: 'budget',
				course_ids: ['main'],
				cuisine_ids: ['italian'],
				tag_ids: [],
				timesofday_ids: ['dinner'],
				tool_ids: [],
				timePrep: 10,
				timeRest: 0,
				timeCook: 20,
				servings: 4,
				ingredientIds: [null, null],
				ingredientCustomNames: [`RT Flour ${RUN}`, `RT Sugar ${RUN}`],
				ingredientAmounts: [200, 50],
				ingredientUnits: ['g', 'g'],
				ingredientNames: [`RT Flour ${RUN}`, `RT Sugar ${RUN}`],
				ingredientIsOptional: [false, false],
				ingredientRawInputs: ['', ''],
				ingredientDetails: ['', ''],
				ingredientNotes: ['', ''],
				ingredientPreparations: ['', ''],
				stepDescriptions: ['Mix everything and bake.']
			};
			const created = (await runOp('recipes.edit', a.ctx, { recipeId: null, data })) as {
				id: string;
			};
			recipeId = created.id;
			recipeIds.push(recipeId);

			await runOp('recipes.edit', a.ctx, {
				recipeId,
				data: { ...data, title: `RT Full ${RUN} v2` }
			});
			const updated = (await runOp('recipes.get', a.ctx, {
				recipeId,
				lang: LANG
			})) as { title: string };
			expect(updated.title).toBe(`RT Full ${RUN} v2`);

			// Cross-user: B cannot even see A's recipe.
			await expect(runOp('recipes.get', b.ctx, { recipeId, lang: LANG })).rejects.toMatchObject({
				name: 'OpError'
			});

			await runOp('recipes.delete', a.ctx, { recipeId, restore: false });
			await expect(runOp('recipes.get', a.ctx, { recipeId, lang: LANG })).rejects.toMatchObject({
				name: 'OpError',
				code: 'NOT_FOUND'
			});
			await runOp('recipes.delete', a.ctx, { recipeId, restore: true });
			const restored = (await runOp('recipes.get', a.ctx, {
				recipeId,
				lang: LANG
			})) as { id: string };
			expect(restored.id).toBe(recipeId);
		});

		it('recipes.upload-image → delete-image (storage round-trip)', async () => {
			const uploaded = (await runOp('recipes.upload-image', a.ctx, {
				recipeId,
				currentImageIds: [],
				file: new File(['fake-png-bytes'], `rt-${RUN}.png`, { type: 'image/png' })
			})) as string;
			expect(typeof uploaded).toBe('string');
			files.push({ bucket: 'recipes', path: `images/${recipeId}/${uploaded}` });
			await runOp('recipes.delete-image', a.ctx, {
				recipeId,
				imageId: uploaded,
				currentImageIds: [uploaded]
			});
		});

		it('recipes.add-examples rejects bad lang before any network', async () => {
			// `runOp` parses with the op's zod schema, so a bad lang is a raw ZodError.
			await expect(runOp('recipes.add-examples', a.ctx, { lang: 'xx' })).rejects.toBeInstanceOf(
				ZodError
			);
		});

		it('plans.add-item → list-items → check → undo → delete → undo', async () => {
			const item = (await runOp('plans.add-item', a.ctx, {
				spaceId: spaceA,
				createdBy: a.id,
				name: `RT Milk ${RUN}`,
				quantity: 2,
				unit: 'l'
			})) as { id: string };
			itemId = item.id;

			const items = (await runOp('plans.list-items', a.ctx, {
				spaceId: spaceA,
				lang: LANG
			})) as Array<{ id: string; name: string }>;
			expect(items.some((i) => i.id === itemId)).toBe(true);

			const checked = (await runOp('plans.check-item', a.ctx, {
				itemId,
				checked: true
			})) as { checked: boolean };
			expect(checked.checked).toBe(true);
			const undoneCheck = (await runOp('plans.check-item', a.ctx, {
				itemId,
				checked: true,
				undo: true
			})) as { checked: boolean };
			expect(undoneCheck.checked).toBe(false);

			const deleted = (await runOp('plans.delete-item', a.ctx, { itemId })) as {
				deletedAt: string | null;
			};
			expect(typeof deleted.deletedAt).toBe('string');
			const restored = (await runOp('plans.delete-item', a.ctx, {
				itemId,
				undo: true,
				expectedDeletedAt: deleted.deletedAt
			})) as { deletedAt: string | null };
			expect(restored.deletedAt).toBeNull();

			// Cross-user: B is not a member → OpError (RLS-guarded).
			await expect(
				runOp('plans.add-item', b.ctx, {
					spaceId: spaceA,
					createdBy: b.id,
					name: 'hijack',
					quantity: 1,
					unit: 'pc'
				})
			).rejects.toMatchObject({ name: 'OpError' });
		});

		it('plans.add-recipe → list-meals → update-servings → move → recommendations → delete → undo', async () => {
			const added = (await runOp('plans.add-recipe', a.ctx, {
				spaceId: spaceA,
				createdBy: a.id,
				recipeId,
				servings: 4
			})) as { mealId: string };
			mealId = added.mealId;
			expect(mealId).toMatch(/^[0-9a-f-]{36}$/);

			const meals = (await runOp('plans.list-meals', a.ctx, {
				spaceId: spaceA,
				lang: LANG
			})) as Array<{
				id: string;
				recipe: {
					servings: number;
					recipe_ingredients: Array<{
						ingredient_id: string | null;
						custom_name: string | null;
						quantity: number | null;
					}>;
				};
			}>;
			const meal = meals.find((m) => m.id === mealId);
			expect(meal, 'meal visible in list').toBeDefined();

			const rescaled = (await runOp('plans.update-servings', a.ctx, {
				spaceId: spaceA,
				mealId,
				servings: 6,
				recipeServings: meal!.recipe.servings,
				ingredients: meal!.recipe.recipe_ingredients.map((ri) => ({
					ingredientId: ri.ingredient_id,
					customName: ri.custom_name,
					quantity: ri.quantity
				}))
			})) as { servings: number };
			expect(rescaled.servings).toBe(6);

			const moved = (await runOp('plans.move-meal', a.ctx, {
				mealId,
				position: 0
			})) as { position: number };
			expect(moved.position).toBe(0);

			const recs = await runOp('plans.recommendations', a.ctx, {
				spaceId: spaceA,
				lang: LANG
			});
			expect(Array.isArray(recs)).toBe(true);

			const cooked = (await runOp('plans.delete-meal', a.ctx, {
				mealId,
				cooked: true
			})) as { cooked: boolean };
			expect(cooked.cooked).toBe(true);

			const deleted = (await runOp('plans.delete-meal', a.ctx, { mealId })) as {
				deletedAt: string | null;
			};
			expect(typeof deleted.deletedAt).toBe('string');
			const restored = (await runOp('plans.delete-meal', a.ctx, {
				mealId,
				undo: true
			})) as { deletedAt: string | null };
			expect(restored.deletedAt).toBeNull();
		});

		it('ingredients.list → match', async () => {
			const list = (await runOp('ingredients.list', a.ctx, { start: 0, end: 5 })) as Array<{
				id: string;
			}>;
			expect(list.length).toBeGreaterThan(0);

			const matched = (await runOp('ingredients.match', a.ctx, {
				ingredientStrings: ['flour', 'fresh milk'],
				lang: LANG
			})) as { matches: Array<{ bestMatches: unknown[] }> };
			expect(matched.matches).toHaveLength(2);
			for (const m of matched.matches) expect(Array.isArray(m.bestMatches)).toBe(true);
		});

		it('admin ingredients: non-admin is FORBIDDEN on every write op', async () => {
			const noAdmin = { ingredientId: '00000000-0000-0000-0000-000000000000' };
			await expect(runOp('ingredients.get', b.ctx, noAdmin)).rejects.toMatchObject({
				name: 'OpError',
				code: 'FORBIDDEN'
			});
			await expect(
				runOp('ingredients.create', b.ctx, {
					slug: `rt-${RUN}`,
					slugGeneral: `rt-${RUN}`,
					aisle: null,
					hierarchy: [],
					baseUnit: 'g',
					initialTranslation: { lang: LANG, nameGeneral: `RT ${RUN}` }
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.update', b.ctx, { ingredientId: noAdmin.ingredientId, patch: {} })
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.upsert-translation', b.ctx, {
					ingredientId: noAdmin.ingredientId,
					lang: LANG,
					nameGeneral: 'x'
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.delete-translation', b.ctx, {
					ingredientId: noAdmin.ingredientId,
					lang: LANG
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.add-substitution', b.ctx, {
					originalIngredientId: noAdmin.ingredientId,
					substituteIngredientId: '11111111-1111-4111-8111-111111111111',
					strength: 'close'
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.update-substitution', b.ctx, {
					substitutionId: noAdmin.ingredientId,
					ratio: 2
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.remove-substitution', b.ctx, { substitutionId: noAdmin.ingredientId })
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
			await expect(
				runOp('ingredients.upload-image', b.ctx, {
					ingredientId: noAdmin.ingredientId,
					file: new File(['x'], 'x.jpg', { type: 'image/jpeg' })
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'FORBIDDEN' });
		});

		it('admin ingredients: create → get → update → translate → substitute → image', async () => {
			// Promote `a` to admin for this test only (restored at the end).
			await admin.from('user_permissions').update({ role: 'admin' }).eq('user_id', a.id);
			try {
				const slug = `rt-ingredient-${RUN}`;
				const created = (await runOp('ingredients.create', a.ctx, {
					slug,
					slugGeneral: slug,
					aisle: 'fruits-vegetables',
					hierarchy: ['produce'],
					baseUnit: 'g',
					initialTranslation: {
						lang: LANG,
						nameSingular: `RT Thing ${RUN}`,
						namePlural: `RT Things ${RUN}`,
						nameGeneral: `RT Thing ${RUN}`,
						commonlyUsed: 'rare'
					}
				})) as { id: string };
				expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
				const ingredientId: string = created.id;

				// Duplicate slug → CONFLICT (no orphan translation left behind).
				await expect(
					runOp('ingredients.create', a.ctx, {
						slug,
						slugGeneral: `${slug}-other`,
						aisle: null,
						hierarchy: [],
						baseUnit: 'g',
						initialTranslation: { lang: LANG, nameGeneral: `RT Dup ${RUN}` }
					})
				).rejects.toMatchObject({ name: 'OpError', code: 'CONFLICT' });

				const gotten = (await runOp('ingredients.get', a.ctx, { ingredientId })) as {
					ingredient: { slug: string };
					translations: Array<{ name_general: string }>;
					substitutionsAsOriginal: unknown[];
					substitutionsAsSubstitute: unknown[];
				};
				expect(gotten.ingredient.slug).toBe(slug);
				expect(gotten.translations).toHaveLength(1);

				await runOp('ingredients.update', a.ctx, {
					ingredientId,
					patch: { aisle: 'milk-cheese', gPerMl: 1.03 }
				});
				const updated = (await runOp('ingredients.get', a.ctx, { ingredientId })) as {
					ingredient: { aisle: string; g_per_ml: number };
				};
				expect(updated.ingredient.aisle).toBe('milk-cheese');
				expect(updated.ingredient.g_per_ml).toBeCloseTo(1.03);

				// Empty patch → VALIDATION; unknown id → NOT_FOUND.
				await expect(runOp('ingredients.update', a.ctx, { ingredientId, patch: {} }))
					.rejects.toMatchObject({ name: 'OpError', code: 'VALIDATION' });
				await expect(
					runOp('ingredients.update', a.ctx, {
						ingredientId: '00000000-0000-0000-0000-000000000000',
						patch: { aisle: 'unknown' }
					})
				).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });

				// Second language, then delete it (twice → NOT_FOUND the 2nd time).
				await runOp('ingredients.upsert-translation', a.ctx, {
					ingredientId,
					lang: 'fr-FR',
					nameSingular: `RT Chose ${RUN}`,
					nameGeneral: `RT Chose ${RUN}`
				});
				const bilingual = (await runOp('ingredients.get', a.ctx, { ingredientId })) as {
					translations: Array<{ language: { lang: string } }>;
				};
				expect(bilingual.translations).toHaveLength(2);
				await runOp('ingredients.delete-translation', a.ctx, { ingredientId, lang: 'fr-FR' });
				await expect(
					runOp('ingredients.delete-translation', a.ctx, { ingredientId, lang: 'fr-FR' })
				).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });

				// Substitution target + link lifecycle.
				const target = (await runOp('ingredients.create', a.ctx, {
					slug: `${slug}-sub`,
					slugGeneral: `${slug}-sub`,
					aisle: null,
					hierarchy: [],
					baseUnit: 'unit',
					initialTranslation: { lang: LANG, nameGeneral: `RT Sub ${RUN}` }
				})) as { id: string };

				await expect(
					runOp('ingredients.add-substitution', a.ctx, {
						originalIngredientId: ingredientId,
						substituteIngredientId: ingredientId,
						strength: 'equivalent'
					})
				).rejects.toMatchObject({ name: 'OpError', code: 'VALIDATION' });
				const sub = (await runOp('ingredients.add-substitution', a.ctx, {
					originalIngredientId: ingredientId,
					substituteIngredientId: target.id,
					strength: 'close',
					ratio: 0.5
				})) as { id: string };
				await expect(
					runOp('ingredients.add-substitution', a.ctx, {
						originalIngredientId: ingredientId,
						substituteIngredientId: target.id,
						strength: 'close'
					})
				).rejects.toMatchObject({ name: 'OpError', code: 'CONFLICT' });

				const withSub = (await runOp('ingredients.get', a.ctx, { ingredientId })) as {
					substitutionsAsOriginal: Array<{ id: string }>;
				};
				expect(withSub.substitutionsAsOriginal.some((s) => s.id === sub.id)).toBe(true);

				await runOp('ingredients.update-substitution', a.ctx, {
					substitutionId: sub.id,
					strength: 'equivalent',
					ratio: 1
				});
				await runOp('ingredients.remove-substitution', a.ctx, { substitutionId: sub.id });
				await expect(
					runOp('ingredients.remove-substitution', a.ctx, { substitutionId: sub.id })
				).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });

				// Image replace (storage round-trip, cleaned up in afterAll).
				const uploaded = (await runOp('ingredients.upload-image', a.ctx, {
					ingredientId,
					file: new File(['fake-jpg-bytes'], `rt-${RUN}.jpg`, { type: 'image/jpeg' })
				})) as { path: string };
				expect(uploaded.path).toBe(`images/${ingredientId}.jpg`);
				files.push({ bucket: 'ingredients', path: uploaded.path });

				// Best-effort cleanup, strictly scoped to this run's rows.
				await admin.from('ingredient_substitutions').delete().eq('original_ingredient_id', ingredientId);
				await admin.from('ingredients').delete().in('id', [ingredientId, target.id]);
			} finally {
				await admin.from('user_permissions').update({ role: 'user' }).eq('user_id', a.id);
			}
		});

		it('billing.balance → logs', async () => {
			const balance = (await runOp('billing.balance', a.ctx, {})) as {
				balance: { balance: number } | null;
				error: unknown;
			};
			expect(balance.error).toBeNull();
			expect(typeof balance.balance?.balance).toBe('number');

			const logs = (await runOp('billing.logs', a.ctx, { limit: 10 })) as {
				logs: unknown[] | null;
				error: unknown;
			};
			expect(logs.error).toBeNull();
		});

		it('languages.list contains en-US', async () => {
			const langs = (await runOp('languages.list', a.ctx, {})) as Array<{ lang: string }>;
			expect(langs.some((l) => l.lang === 'en-US')).toBe(true);
		});

		it('auth tokens create → use → revoke (+ cross-user revoke is NOT_FOUND)', async () => {
			const created = (await runOp('auth.create-token', a.ctx, {
				name: `rt-${RUN}`
			})) as { id: string; secret: string };
			tokenId = created.id;
			tokenSecret = created.secret;
			expect(tokenSecret.startsWith('cui_')).toBe(true);

			const listed = (await runOp('auth.list-tokens', a.ctx, {})) as Array<{ id: string }>;
			expect(listed.some((t) => t.id === tokenId)).toBe(true);

			// "use": the same lookup `requireApiCtx` runs for every PAT request.
			await expect(resolvePatToken(tokenSecret, admin)).resolves.toBe(a.id);

			await expect(runOp('auth.revoke-token', b.ctx, { id: tokenId })).rejects.toMatchObject({
				name: 'OpError',
				code: 'NOT_FOUND'
			});

			await runOp('auth.revoke-token', a.ctx, { id: tokenId });
			const after = (await runOp('auth.list-tokens', a.ctx, {})) as Array<{
				id: string;
				revokedAt: string | null;
			}>;
			const revoked = after.find((t) => t.id === tokenId);
			expect(revoked?.revokedAt, 'revoked token stays listed with revoked_at set').not.toBeNull();
			await expect(resolvePatToken(tokenSecret, admin)).rejects.toMatchObject({
				name: 'OpError'
			});
		});

		it('import-from-text with empty seeds → INSUFFICIENT_SEEDS (stream path)', async () => {
			const seen: unknown[] = [];
			await expect(
				(async () => {
					for await (const value of runOpStream('recipes.import-from-text', a.ctx, {
						spaceId: spaceA,
						text: 'My round-trip test recipe with enough characters to parse.',
						lang: LANG
					})) {
						seen.push(value);
					}
				})()
			).rejects.toMatchObject({ name: 'OpError', code: 'INSUFFICIENT_SEEDS' });
		});

		it('runOp refuses streaming ops (fail-fast M2 guard)', async () => {
			await expect(
				runOp('recipes.import-from-text', a.ctx, {
					spaceId: spaceA,
					text: 'My round-trip test recipe with enough characters to parse.',
					lang: LANG
				})
			).rejects.toMatchObject({ name: 'OpError', code: 'INTERNAL' });
		});

		it('billing.checkout validates origin + minimum before Stripe', async () => {
			// Both are schema-level guards: `origin` must be an absolute URL and
			// `amountChosen` >= the fixed minimum — enforced by zod before the
			// handler (and Stripe) ever runs.
			await expect(
				runOp('billing.checkout', a.ctx, {
					amountChosen: 10,
					currency: 'EUR',
					interval: 'once',
					origin: 'not-a-url'
				})
			).rejects.toBeInstanceOf(ZodError);
			await expect(
				runOp('billing.checkout', a.ctx, {
					amountChosen: 1,
					currency: 'EUR',
					interval: 'once',
					origin: 'https://example.com'
				})
			).rejects.toBeInstanceOf(ZodError);
		});

		it('unknown ids are NOT_FOUND (no existence leaks)', async () => {
			const missing = '00000000-0000-0000-0000-000000000000';
			await expect(
				runOp('recipes.get', a.ctx, { recipeId: missing, lang: LANG })
			).rejects.toMatchObject({
				name: 'OpError',
				code: 'NOT_FOUND'
			});
			await expect(
				runOp('plans.check-item', a.ctx, { itemId: missing, checked: true })
			).rejects.toMatchObject({ name: 'OpError', code: 'NOT_FOUND' });
		});
	});
}
