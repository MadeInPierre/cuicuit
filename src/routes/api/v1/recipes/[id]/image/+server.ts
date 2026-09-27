import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { resizeToRecipeThumbnail } from '$lib/core/operations/recipes/image-resize.js';
import { readJson, readUpload, requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { file, fields } = await readUpload(event, 'file');
		let currentImageIds: string[] | null = null;
		if (fields.currentImageIds !== undefined && fields.currentImageIds !== '') {
			try {
				currentImageIds = JSON.parse(fields.currentImageIds);
			} catch {
				throw new OpError('VALIDATION', 'Invalid currentImageIds: must be a JSON array.');
			}
		}
		// 480px WebP thumbnail for cards/lists (sharp, server-side). Null on
		// failure — the upload still succeeds, cards fall back to full.
		let thumbnailFile: File | null = null;
		try {
			const thumbBytes = await resizeToRecipeThumbnail(new Uint8Array(await file.arrayBuffer()));
			thumbnailFile = new File([thumbBytes], 'thumbnail.webp', { type: 'image/webp' });
		} catch (thumbError) {
			console.warn('Failed to resize uploaded image, skipping thumbnail:', thumbError);
		}
		return await runApiOp('recipes.upload-image', auth, {
			recipeId: event.params.id,
			currentImageIds,
			file,
			thumbnailFile
		});
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return await runApiOp('recipes.delete-image', auth, {
			recipeId: event.params.id,
			imageId: body.imageId,
			currentImageIds: body.currentImageIds
		});
	} catch (error) {
		return toResponse(error);
	}
}
