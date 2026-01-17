// TODO when an internet connection is available, use an LLM to parse and enrich ingredient data instead of the regex-based local parser (./parse.ts).

export function enrichIngredientStrings(
	input: string[],
	lang: string = 'en-US'
): Promise<string[]> {
	throw new Error('Not implemented: enrichIngredientStrings');
}
