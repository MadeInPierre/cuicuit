import sharp from 'sharp';

import { RECIPE_THUMBNAIL_WIDTH } from './image-shared.js';

/**
 * Recipe thumbnail rendering — server-only (`sharp` is a native module).
 *
 * Never imported from browser code (the `recipes.upload-image` op is
 * browser-direct and bundled for the client). Server paths use this:
 * the URL-import pipeline and the REST upload door. The browser upload
 * path resizes with canvas instead
 * (`features/recipes/utils/make-recipe-thumbnail.ts`).
 */

/** Downscales any image to a 480px (longest edge) WebP. Never upscales. */
export async function resizeToRecipeThumbnail(bytes: Uint8Array): Promise<Uint8Array> {
	const out = await sharp(bytes)
		.rotate()
		.resize(RECIPE_THUMBNAIL_WIDTH, RECIPE_THUMBNAIL_WIDTH, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({ quality: 75 })
		.toBuffer();
	return new Uint8Array(out);
}
