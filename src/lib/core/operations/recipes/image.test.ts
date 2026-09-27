import { describe, expect, it } from 'vitest';

import sharp from 'sharp';

import {
	getRecipeImageUrl,
	RECIPE_THUMBNAIL_WIDTH,
	recipeImagePath,
	recipeThumbnailPath,
	thumbnailFileName
} from './image-shared.js';
import { resizeToRecipeThumbnail } from './image-resize.js';

/**
 * Recipe image unit tests — pure functions only, no network, no DB.
 * (Mirrors `ingredients/image.test.ts`.)
 */

describe('thumbnail naming', () => {
	it('derives a -thumbnail.webp name from any image id', () => {
		expect(thumbnailFileName('a1b2c3.jpg')).toBe('a1b2c3-thumbnail.webp');
		expect(thumbnailFileName('a1b2c3.PNG')).toBe('a1b2c3-thumbnail.webp');
		expect(thumbnailFileName('no-extension')).toBe('no-extension-thumbnail.webp');
	});

	it('keeps the original storage path convention unchanged', () => {
		const recipeId = '11111111-1111-4111-8111-111111111111';
		expect(recipeImagePath(recipeId, 'a1b2.jpg')).toBe(`images/${recipeId}/a1b2.jpg`);
		expect(recipeThumbnailPath(recipeId, 'a1b2.jpg')).toBe(
			`images/${recipeId}/a1b2-thumbnail.webp`
		);
	});

	it('builds thumb vs full public URLs', () => {
		const recipeId = '11111111-1111-4111-8111-111111111111';
		expect(getRecipeImageUrl('https://x.supabase.co', recipeId, 'a1b2.jpg', 'thumb')).toBe(
			`https://x.supabase.co/storage/v1/object/public/recipes/images/${recipeId}/a1b2-thumbnail.webp`
		);
		expect(getRecipeImageUrl('https://x.supabase.co', recipeId, 'a1b2.jpg', 'full')).toBe(
			`https://x.supabase.co/storage/v1/object/public/recipes/images/${recipeId}/a1b2.jpg`
		);
		// Cards default to the thumbnail.
		expect(getRecipeImageUrl('https://x.supabase.co', recipeId, 'a1b2.jpg')).toContain(
			'-thumbnail.webp'
		);
	});
});

describe('thumbnail resize', () => {
	it('downscales a large source to a 480px WebP', async () => {
		const large = await sharp({
			create: { width: 1000, height: 800, channels: 3, background: { r: 200, g: 0, b: 0 } }
		})
			.png()
			.toBuffer();
		const out = await resizeToRecipeThumbnail(new Uint8Array(large));
		const meta = await sharp(out).metadata();
		expect(meta.width).toBe(RECIPE_THUMBNAIL_WIDTH);
		expect(meta.format).toBe('webp');
		expect(RECIPE_THUMBNAIL_WIDTH).toBe(480);
	});

	it('never upscales a tiny source', async () => {
		const tiny = await sharp({
			create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 200, b: 0 } }
		})
			.png()
			.toBuffer();
		const out = await resizeToRecipeThumbnail(new Uint8Array(tiny));
		const meta = await sharp(out).metadata();
		expect(meta.width).toBe(10);
		expect(meta.height).toBe(10);
		expect(meta.format).toBe('webp');
	});
});
