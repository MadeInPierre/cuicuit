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
		source.nameGeneral,
		source.nameSingular && source.nameSingular !== source.nameGeneral ? source.nameSingular : null,
		source.namePlural && source.namePlural !== source.nameGeneral ? source.namePlural : null
	]
		.filter(Boolean)
		.join(', ');
	const aisle = source.aisle ? ` from the ${source.aisle.replace(/-/g, ' ')} aisle` : '';
	return (
		`Top-down food photography of ${names}${aisle}, single fresh ingredient ` +
		`on a transparent background, natural daylight, no text, no packaging, no people, no utensils, no shadow.`
	);
}
