import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import {
	buildImagePrompt,
	candidatePath,
	candidatePrefix,
	ingredientImagePath
} from './image-shared.js';
import { generateSingleImage, resolveImageModel } from './openai-images.js';
import { requireAdmin } from './require-admin.js';

export const generateIngredientImageInput = z.object({
	ingredientId: z.string().uuid(),
	/** Custom prompt from the admin textarea. Omitted → default built from the en-US name. */
	prompt: z.string().trim().min(1).max(2000).optional(),
	model: z.string().min(1).max(100).optional()
});

export type GenerateIngredientImageInput = z.infer<typeof generateIngredientImageInput>;

/** Storage stamp: timestamp + randomness, sortable and collision-free. */
export function candidateStamp(): string {
	return `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * `ingredients.generate-image` — admin-only: generates one AI image into
 * `candidates/` (M5).
 *
 * Never touches the active image (`images/{id}.jpg`): the admin promotes a
 * candidate afterwards via `ingredients.promote-image`. On the first
 * generation the current active image is snapshotted into `candidates/`
 * (best-effort) so experimenting can't lose it.
 */
export const generateIngredientImageOp = defineOp({
	name: 'ingredients.generate-image',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Generate an AI candidate image (admin)',
		description:
			'Admin-only: generates one image with gpt-image into candidates/{id}/ without changing the active image. Promote with ingredients.promote-image.'
	},
	input: generateIngredientImageInput,
	internal: true,
	handler: async (ctx: OpCtx, input: GenerateIngredientImageInput) => {
		const admin = await requireAdmin(ctx);

		const { data: ingredient, error: ingredientError } = await admin
			.from('ingredients')
			.select('id, aisle')
			.eq('id', input.ingredientId)
			.maybeSingle();
		if (ingredientError) {
			throw new OpError('INTERNAL', 'Failed to load ingredient.', ingredientError);
		}
		if (!ingredient) {
			throw new OpError('NOT_FOUND', 'Ingredient not found.');
		}
		const { data: translations } = await admin
			.from('ingredient_translations')
			.select('name_general, name_singular, name_plural, language:languages!inner(lang)')
			.eq('ingredient_id', input.ingredientId);
		const en = (translations ?? []).find(
			(t) => (t.language as unknown as { lang: string })?.lang === 'en-US'
		);
		const first = (translations ?? [])[0];
		const source = en ?? first;
		if (!source) {
			throw new OpError('VALIDATION', 'Ingredient has no translation to describe it with.');
		}

		const prompt =
			input.prompt ??
			buildImagePrompt({
				nameGeneral: source.name_general,
				nameSingular: source.name_singular,
				namePlural: source.name_plural,
				aisle: ingredient.aisle
			});
		const model = input.model ?? resolveImageModel();
		const { bytes } = await generateSingleImage(prompt, model);

		// Auto-snapshot the active image once, so the current visual is kept.
		let snapshotted = false;
		const existing = await admin.storage
			.from('ingredients')
			.list(candidatePrefix(input.ingredientId));
		if (!existing.error && (existing.data ?? []).length === 0) {
			const { data: active, error: activeError } = await admin.storage
				.from('ingredients')
				.download(ingredientImagePath(input.ingredientId));
			if (!activeError && active) {
				const snap = await admin.storage
					.from('ingredients')
					.upload(candidatePath(input.ingredientId, `${candidateStamp()}-current`), active, {
						contentType: active.type || 'image/png',
						upsert: true
					});
				if (!snap.error) snapshotted = true;
			}
		}

		const path = candidatePath(input.ingredientId, candidateStamp());
		const { error: uploadError } = await admin.storage
			.from('ingredients')
			.upload(path, bytes, { contentType: 'image/png', upsert: true });
		if (uploadError) {
			throw new OpError('INTERNAL', 'Failed to store the generated image.', uploadError);
		}
		return { candidatePath: path, promptUsed: prompt, model, snapshotted };
	}
});
