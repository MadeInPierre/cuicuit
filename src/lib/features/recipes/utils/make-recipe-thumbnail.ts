import { RECIPE_THUMBNAIL_WIDTH } from '$lib/core/operations/recipes/image-shared.js';

/**
 * Browser-side recipe thumbnail (480px longest edge, WebP via canvas).
 *
 * Returns `null` when the browser can't do it (no `createImageBitmap`,
 * encode failure, …) — callers then upload the original only and the UI
 * falls back to the full image, so uploads never fail because of this.
 */
export async function tryMakeRecipeThumbnail(source: File | Blob): Promise<File | null> {
	try {
		if (
			typeof window === 'undefined' ||
			typeof document === 'undefined' ||
			typeof createImageBitmap !== 'function'
		) {
			return null;
		}
		const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
		try {
			const scale = Math.min(1, RECIPE_THUMBNAIL_WIDTH / Math.max(bitmap.width, bitmap.height));
			const width = Math.max(1, Math.round(bitmap.width * scale));
			const height = Math.max(1, Math.round(bitmap.height * scale));
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.drawImage(bitmap, 0, 0, width, height);
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/webp', 0.75)
			);
			if (!blob) return null;
			return new File([blob], 'thumbnail.webp', { type: 'image/webp' });
		} finally {
			bitmap.close();
		}
	} catch {
		return null;
	}
}
