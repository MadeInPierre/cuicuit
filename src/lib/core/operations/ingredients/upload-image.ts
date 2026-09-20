import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { requireAdminSelf } from './require-admin.js';

export const uploadIngredientImageInput = z.object({
	ingredientId: z.string().uuid(),
	file: z.custom<File>((value) => value instanceof File, {
		message: 'No file to upload.'
	})
});

export type UploadIngredientImageInput = z.infer<typeof uploadIngredientImageInput>;

/** Storage path convention (matches `IngredientImage.svelte`). */
export const ingredientImagePath = (ingredientId: string) => `images/${ingredientId}.jpg`;

/**
 * `ingredients.upload-image` — admin-only: replaces the ingredient image.
 *
 * Unlike the other admin ops this one runs browser-direct (same pattern as
 * `recipes.upload-image`): `File` cannot travel through a `*.remote.ts`
 * command, so the handler uses `ctx.supabase` (user JWT) and the write is
 * enforced by the admin-gated storage RLS policies in `99_RLS.sql`.
 * `requireAdminSelf` fails fast for non-admins; even bypassed, storage RLS
 * rejects the upload server-side.
 */
export const uploadIngredientImageOp = defineOp({
	name: 'ingredients.upload-image',
	domain: 'ingredients',
	kind: 'storage',
	sync: 'synced',
	docs: {
		title: 'Upload an ingredient image (admin)',
		description: 'Admin-only: replaces the public ingredient image (`images/{id}.jpg`).',
	},
	input: uploadIngredientImageInput,
	internal: true,
	handler: async (ctx: OpCtx, { ingredientId, file }: UploadIngredientImageInput) => {
		await requireAdminSelf(ctx);

		const { data: ingredient, error: ingredientError } = await ctx.supabase
			.from('ingredients')
			.select('id')
			.eq('id', ingredientId)
			.maybeSingle();
		if (ingredientError) {
			throw new OpError('INTERNAL', 'Failed to load ingredient.', ingredientError);
		}
		if (!ingredient) {
			throw new OpError('NOT_FOUND', 'Ingredient not found.');
		}

		const path = ingredientImagePath(ingredientId);
		const { error: uploadError } = await ctx.supabase.storage
			.from('ingredients')
			.upload(path, file, {
				contentType: file.type || 'image/jpeg',
				upsert: true
			});
		if (uploadError) {
			throw new OpError('INTERNAL', 'Failed to upload ingredient image.', uploadError);
		}
		return { path };
	}
});
