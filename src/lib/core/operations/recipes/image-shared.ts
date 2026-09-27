/**
 * Shared recipe-image helpers — client-safe pure functions only.
 *
 * No server imports here (`sharp`, supabase, …): the browser upload path,
 * the Svelte components, and the server ops all reuse these so naming can
 * never drift apart.
 *
 * Storage layout (all inside the public `recipes` bucket):
 * - Original (unchanged convention, stored in `recipes.image_ids`):
 *   `images/{recipeId}/{uuid}.{ext}`
 * - Thumbnail (derived by convention, never stored in the DB):
 *   `images/{recipeId}/{uuid}-thumbnail.webp` (480px longest edge, WebP)
 *
 * Deriving the thumbnail by convention means no schema migration, and the
 * existing storage RLS policies keep passing (they only constrain the
 * `images/{recipeUuid}` prefix, not filenames). When no thumbnail exists
 * (legacy images, failed resize), components fall back to the full image.
 */

/** Longest edge of the thumbnail, in pixels. */
export const RECIPE_THUMBNAIL_WIDTH = 480;

/** `a1b2c3.jpg` → `a1b2c3-thumbnail.webp` (extensionless ids get the suffix too). */
export function thumbnailFileName(imageId: string): string {
	const dot = imageId.lastIndexOf('.');
	const base = dot > 0 ? imageId.slice(0, dot) : imageId;
	return `${base}-thumbnail.webp`;
}

export const recipeImagePath = (recipeId: string, imageId: string) =>
	`images/${recipeId}/${imageId}`;

export const recipeThumbnailPath = (recipeId: string, imageId: string) =>
	`images/${recipeId}/${thumbnailFileName(imageId)}`;

export type RecipeImageVariant = 'thumb' | 'full';

/**
 * Public URL for a recipe image. `thumb` is the 480px WebP for cards and
 * lists; `full` is the original for the recipe detail page. Renderers fall
 * back to `full` when the thumbnail 404s.
 */
export function getRecipeImageUrl(
	supabaseUrl: string,
	recipeId: string,
	imageId: string,
	variant: RecipeImageVariant = 'thumb'
): string {
	const file = variant === 'thumb' ? thumbnailFileName(imageId) : imageId;
	return `${supabaseUrl}/storage/v1/object/public/recipes/${recipeImagePath(recipeId, file)}`;
}
