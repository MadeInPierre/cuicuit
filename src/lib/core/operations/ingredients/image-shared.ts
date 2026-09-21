/**
 * Shared ingredient-image helpers (M5) — client-safe pure functions only.
 *
 * No server imports here (`$env`, supabase, …): the admin UI imports
 * `buildImagePrompt` to prefill the editable prompt textarea, while the
 * server ops reuse the same builders so client prefill and server default
 * can never drift apart.
 *
 * Storage layout (all inside the public `ingredients` bucket):
 * - Active image (unchanged convention, used by the app):
 *   `images/{ingredientId}.jpg`
 * - Generated / snapshotted candidates (never read by the app):
 *   `candidates/{ingredientId}/{stamp}.png` (PNG: transparency needs alpha)
 *
 * The active image keeps its historical `images/{id}.jpg` path (the app URL
 * never changes) — a promoted PNG is stored under that same path with an
 * `image/png` content type, which browsers render fine regardless of the
 * extension.
 */

export const ingredientImagePath = (ingredientId: string) => `images/${ingredientId}.jpg`;

export const candidatePrefix = (ingredientId: string) => `candidates/${ingredientId}/`;

export const candidatePath = (ingredientId: string, stamp: string) =>
	`${candidatePrefix(ingredientId)}${stamp}.png`;

/** `true` only for paths this ingredient's promote/delete ops may touch. */
export function isCandidateOf(ingredientId: string, path: string): boolean {
	if (!path.endsWith('.png')) return false;
	if (!path.startsWith(candidatePrefix(ingredientId))) return false;
	// No nested folders, no traversal: exactly one segment after the prefix.
	const rest = path.slice(candidatePrefix(ingredientId).length);
	return rest.length > 4 && !rest.includes('/');
}

export interface ImagePromptSource {
	nameGeneral: string;
	nameSingular?: string | null;
	namePlural?: string | null;
	aisle?: string | null;
}

/**
 * Default generation prompt. Kept deliberately short (image tokens cost
 * money) but specific enough for consistent catalog-style shots: single
 * ingredient, transparent background, no text.
 */
export function buildImagePrompt(source: ImagePromptSource): string {
	const names = [
		source.nameSingular && source.nameSingular !== source.nameGeneral ? source.nameSingular : null,
		source.namePlural && source.namePlural !== source.nameGeneral ? source.namePlural : null,
		source.nameGeneral,
	]
		.filter(Boolean)
		.join(', ');
	const aisle = source.aisle ? ` from the '${source.aisle.replace(/-/g, ' ')}' aisle` : '';
	return `Icon image of the ingredient "${names}${aisle}". This icon will be used in a groceries app among other similar images of ingredients.

If an image is attached, it is a reference image FOR INSPIRATION ONLY, YOUR IMAGE MUST LOOK OBVIOUSLY DIFFERENT THAN THE SOURCE IMAGE. The source image is only to give you ideas, do not follow it blindly - use a different angle or way of displaying the ingredient that would make more sense. Change at least the rotation or pose and preferably more to make the ingredient look better. Icons will be small on the screen so make sure the ingredient will be clearly identifiable from afar.

The goal is to represent the ingredient or item as naturally as possible, just as it may be found in supermarkets or naturally. If it really makes more sense to display multiple instances of the item (e.g. a few bananas, a grape of tomatoes), prefer that to make it look natural and intuitive - otherwise keep it as simple as possible (e.g. single raw ingredient).

Design requirements:
- Transparent PNG background (alpha 0 pixels).
- Natural daylight.
- Add a soft small discreet drop shadow toward the bottom (only using black pixels and the alpha transparency, do not use kinda-white pixels).
- No text.
- Centered ingredient with little-to-no transparent padding around the sides.
- The ingredient MUST LOOK 100% PHOTOREALISTIC AND REAL, it must look like it was taken by a real photographer.
- Prefer the most natural look of the ingredient/food (e.g. entire fruit/veggie rather than small pieces, powder for spices instead of a packaging, etc). It should look like how it is usually sold in supermarkets, without any packaging (or without any branding if packaging is needed).
- If relevant, you may occasionally add tiny cosmetic details (e.g. parsley leaf on top of spaghetti).`;
}
