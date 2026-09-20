import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { candidatePrefix } from './image-shared.js';
import { requireAdmin } from './require-admin.js';

export const listImageCandidatesInput = z.object({
	ingredientId: z.string().uuid()
});

export type ListImageCandidatesInput = z.infer<typeof listImageCandidatesInput>;

export interface ImageCandidate {
	path: string;
	name: string;
	createdAt: string | null;
}

/**
 * `ingredients.list-image-candidates` — admin-only: lists the generated /
 * snapshotted candidates in `candidates/{id}/`, newest first (M5).
 *
 * Storage-only by design (no new table): candidates are experiment
 * thumbnails; only the promoted active image matters to the app.
 */
export const listImageCandidatesOp = defineOp({
	name: 'ingredients.list-image-candidates',
	domain: 'ingredients',
	kind: 'read',
	sync: 'server-only',
	docs: {
		title: 'List AI image candidates (admin)',
		description:
			'Admin-only: lists candidate images in candidates/{id}/ (newest first). The active image is not included.'
	},
	input: listImageCandidatesInput,
	internal: true,
	handler: async (ctx: OpCtx, input: ListImageCandidatesInput) => {
		const admin = await requireAdmin(ctx);

		const { data: ingredient, error: ingredientError } = await admin
			.from('ingredients')
			.select('id')
			.eq('id', input.ingredientId)
			.maybeSingle();
		if (ingredientError) {
			throw new OpError('INTERNAL', 'Failed to load ingredient.', ingredientError);
		}
		if (!ingredient) {
			throw new OpError('NOT_FOUND', 'Ingredient not found.');
		}

		const { data, error } = await admin.storage
			.from('ingredients')
			.list(candidatePrefix(input.ingredientId), { sortBy: { column: 'created_at', order: 'desc' } });
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list image candidates.', error);
		}
		const candidates: ImageCandidate[] = (data ?? [])
			.filter((f) => f.name.endsWith('.png'))
			.map((f) => ({
				path: `${candidatePrefix(input.ingredientId)}${f.name}`,
				name: f.name,
				createdAt: f.created_at ?? null
			}));
		return { candidates };
	}
});
