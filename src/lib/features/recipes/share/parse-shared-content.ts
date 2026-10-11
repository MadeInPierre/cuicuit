/**
 * Classifies an incoming Web Share Target payload (`GET
 * /shared-content-receiver/?url=…&text=…&title=…`, see `share_target` in
 * `vite.config.ts`) into what the app can import.
 *
 * Pure and dependency-free so it stays unit-testable. The actual import
 * work lives in the core `recipes.import-from-url` / `recipes.import-from-text`
 * ops — this only decides which one to call.
 *
 * - Apps share inconsistently: YouTube usually fills `url`, TikTok/Instagram
 *   often stuff the link into `text` ("Check this out https://…"). So every
 *   field is scanned for the first `https?://` URL.
 * - Raw text without any URL (e.g. copied recipe text shared as text) falls
 *   through to `text` so the text-import op can handle it.
 * - Anything else (empty share, photo shares — the manifest declares no
 *   `files`, so images can't reach us via GET) is `empty` and the receiver
 *   page renders an unsupported/coming-soon view instead of importing.
 */

export type SharedContent =
	| { kind: 'url'; url: string }
	| { kind: 'text'; text: string }
	| { kind: 'empty' };

/** Minimum chars worth sending to the text-import op (matches its zod input). */
export const MIN_SHARED_TEXT_LENGTH = 10;

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/g;
/** Punctuation the regex over-captures at the end of a pasted link ("see https://x.y)."). */
const TRAILING_PUNCTUATION = /[.,;:!?'"\])]+$/;

function extractFirstUrl(value: string | null | undefined): string | null {
	if (!value) return null;
	for (const match of value.match(URL_PATTERN) ?? []) {
		const cleaned = match.replace(TRAILING_PUNCTUATION, '');
		try {
			const parsed = new URL(cleaned);
			if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return cleaned;
		} catch {
			// Not a valid URL — keep scanning (there may be another match).
		}
	}
	return null;
}

export function parseSharedContent(input: {
	url?: string | null;
	text?: string | null;
	title?: string | null;
}): SharedContent {
	// Prefer the dedicated `url` field, but it may itself be free text.
	const fromUrl = extractFirstUrl(input.url);
	if (fromUrl) return { kind: 'url', url: fromUrl };

	const fromText = extractFirstUrl(input.text) ?? extractFirstUrl(input.title);
	if (fromText) return { kind: 'url', url: fromText };

	const text = [input.text, input.title]
		.filter((part) => part?.trim())
		.join('\n')
		.trim();
	if (text.length >= MIN_SHARED_TEXT_LENGTH) return { kind: 'text', text };

	return { kind: 'empty' };
}
