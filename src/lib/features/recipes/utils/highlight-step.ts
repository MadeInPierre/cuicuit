export type HighlightKind = 'ingredient' | 'temperature';

export type HighlightSegment = { text: string; kind: HighlightKind | null };

export type HighlightTerm = { text: string; kind: HighlightKind };

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits a step's text into plain, ingredient and temperature segments.
 * Longer terms win so "brown sugar" is not partially matched as "sugar".
 */
export function highlightStepText(text: string, terms: HighlightTerm[]): HighlightSegment[] {
	const byText = new Map<string, HighlightKind>();
	for (const term of terms) {
		const value = term.text.trim();
		if (value) byText.set(value.toLowerCase(), term.kind);
	}
	if (byText.size === 0) return [{ text, kind: null }];

	const uniqueTerms = [...byText.keys()].sort((a, b) => b.length - a.length);
	const pattern = new RegExp(`(${uniqueTerms.map(escapeRegExp).join('|')})`, 'gi');

	return text
		.split(pattern)
		.filter((part) => part !== '')
		.map((part) => ({ text: part, kind: byText.get(part.toLowerCase()) ?? null }));
}
