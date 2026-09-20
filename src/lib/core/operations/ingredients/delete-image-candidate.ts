import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { isCandidateOf } from './image-shared.js';
import { requireAdmin } from './require-admin.js';

export const deleteImageCandidateInput = z.object({
	ingredientId: z.string().uuid(),
	candidatePath: z.string().min(1).max(500)
});

export type DeleteImageCandidateInput = z.infer<typeof deleteImageCandidateInput>;

/**
 * `ingredients.delete-image-candidate` — admin-only: removes one experiment
 * thumbnail from `candidates/` (M5). Never touches the active image.
 */
export const deleteImageCandidateOp = defineOp({
	name: 'ingredients.delete-image-candidate',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Delete an image candidate (admin)',
		description: 'Admin-only: deletes one file from candidates/{id}/. The active image is never affected.'
	},
	input: deleteImageCandidateInput,
	internal: true,
	handler: async (ctx: OpCtx, input: DeleteImageCandidateInput) => {
		const admin = await requireAdmin(ctx);
		if (!isCandidateOf(input.ingredientId, input.candidatePath)) {
			throw new OpError('VALIDATION', 'Candidate path must be candidates/{ingredientId}/<file>.png.');
		}
		const { data, error } = await admin.storage.from('ingredients').remove([input.candidatePath]);
		if (error) {
			throw new OpError('INTERNAL', 'Failed to delete the candidate image.', error);
		}
		if (!data || data.length === 0) {
			throw new OpError('NOT_FOUND', 'Candidate image not found.');
		}
		return { removed: true as const };
	}
});
