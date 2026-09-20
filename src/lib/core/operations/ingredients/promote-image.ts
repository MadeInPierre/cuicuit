import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';
import { ingredientImagePath, isCandidateOf } from './image-shared.js';
import { ICON_SIZE, resizeToIcon } from './image-resize.js';
import { requireAdmin } from './require-admin.js';

export const promoteImageCandidateInput = z.object({
	ingredientId: z.string().uuid(),
	candidatePath: z.string().min(1).max(500)
});

export type PromoteImageCandidateInput = z.infer<typeof promoteImageCandidateInput>;

/**
 * `ingredients.promote-image` — admin-only: publishes a candidate as the
 * active image `images/{id}.jpg` (M5).
 *
 * The candidate stays full-size in `candidates/` (archival copy); the
 * published file is cover-fit down to a 128×128 PNG icon to keep egress
 * tiny. The app URL never changes, so promotion is instant for all users
 * (modulo CDN cache — the UI cache-busts its preview after promoting).
 */
export const promoteImageCandidateOp = defineOp({
	name: 'ingredients.promote-image',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Promote a candidate to the active image (admin)',
		description:
			'Admin-only: publishes candidates/{id}/<file>.png as the active images/{id}.jpg, downscaled to a 128×128 PNG icon (same URL). The full-size candidate is kept.'
	},
	input: promoteImageCandidateInput,
	internal: true,
	handler: async (ctx: OpCtx, input: PromoteImageCandidateInput) => {
		const admin = await requireAdmin(ctx);
		if (!isCandidateOf(input.ingredientId, input.candidatePath)) {
			throw new OpError('VALIDATION', 'Candidate path must be candidates/{ingredientId}/<file>.png.');
		}

		const { data: blob, error: downloadError } = await admin.storage
			.from('ingredients')
			.download(input.candidatePath);
		if (downloadError || !blob) {
			throw new OpError('NOT_FOUND', 'Candidate image not found.', downloadError);
		}
		let icon: Uint8Array;
		try {
			icon = await resizeToIcon(new Uint8Array(await blob.arrayBuffer()));
		} catch (error) {
			throw new OpError('INTERNAL', 'Failed to resize the candidate image.', error);
		}
		const path = ingredientImagePath(input.ingredientId);
		const { error: uploadError } = await admin.storage
			.from('ingredients')
			.upload(path, icon, { contentType: 'image/png', upsert: true });
		if (uploadError) {
			throw new OpError('INTERNAL', 'Failed to promote the candidate image.', uploadError);
		}
		return { path, iconSize: ICON_SIZE };
	}
});
