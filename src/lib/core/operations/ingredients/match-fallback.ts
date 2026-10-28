import {
	DEFAULT_LANGUAGE,
	isCuratedLanguageCode,
	type LanguageCode
} from '$lib/shared/language.js';

/** The ingredient name fields used to try catalog matches in order. */
export type IngredientNameCandidate = {
	ingredientName: string;
	ingredientNameEn?: string | null;
	ingredientNameEnGeneral?: string | null;
};

export type IngredientMatchTier = {
	field: keyof IngredientNameCandidate;
	lang: LanguageCode;
};

/**
 * Match tiers for a recipe language. Curated languages can match their own
 * translations first; other languages only have the English fallbacks.
 */
export function ingredientMatchTiers(recipeLang: LanguageCode): IngredientMatchTier[] {
	return [
		...(isCuratedLanguageCode(recipeLang)
			? [{ field: 'ingredientName' as const, lang: recipeLang }]
			: []),
		{ field: 'ingredientNameEn', lang: DEFAULT_LANGUAGE },
		{ field: 'ingredientNameEnGeneral', lang: DEFAULT_LANGUAGE }
	];
}

/**
 * Matches each candidate by trying the tiers in order and keeping the first
 * non-empty result. Only still-unmatched candidates are sent to later tiers.
 * Results stay aligned with the input list.
 */
export async function matchIngredientNames<T>(
	candidates: readonly IngredientNameCandidate[],
	recipeLang: LanguageCode,
	match: (names: string[], lang: LanguageCode) => Promise<readonly (readonly T[] | null)[]>
): Promise<T[][]> {
	const results = candidates.map((): T[] => []);
	let pending = candidates.map((_, index) => index);
	const tried = candidates.map(() => new Set<string>());

	for (const tier of ingredientMatchTiers(recipeLang)) {
		const indices: number[] = [];
		const names: string[] = [];

		for (const index of pending) {
			const name = candidates[index][tier.field]?.trim();
			if (!name) continue;
			const key = `${tier.lang}\u0000${name.toLowerCase()}`;
			if (tried[index].has(key)) continue;
			tried[index].add(key);
			indices.push(index);
			names.push(name);
		}

		if (names.length === 0) continue;

		const tierMatches = await match(names, tier.lang);
		const positions = new Map(indices.map((index, position) => [index, position]));
		const stillPending: number[] = [];

		for (const index of pending) {
			const position = positions.get(index);
			const best = position === undefined ? undefined : tierMatches[position];
			if (best && best.length > 0) {
				results[index] = [...best];
			} else {
				stillPending.push(index);
			}
		}

		pending = stillPending;
		if (pending.length === 0) break;
	}

	return results;
}
