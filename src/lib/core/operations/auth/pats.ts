/**
 * Personal Access Token format + hashing helpers.
 *
 * Uses only the Web Crypto API (no `node:` imports — no `@types/node` in this
 * repo, and WebCrypto also runs on edge runtimes). Imported by the
 * `auth.*-token` ops and `auth.ts:resolvePatToken` — server-side only, never
 * from browser code. Tokens look like `cui_<12-char public id>_<43-char
 * secret>`; only the SHA-256 hash of the full secret is stored
 * (`user_api_tokens.token_hash`), the secret itself is shown once at creation
 * and never persisted.
 */
export const PAT_PREFIX = 'cui_';

/** Number of non-revoked tokens a user may hold (creation beyond this → CONFLICT). */
export const MAX_ACTIVE_TOKENS = 10;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomPart(length: number): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
	return out;
}

export function generatePat(): { secret: string; prefix: string } {
	const publicId = randomPart(12);
	const secretPart = randomPart(43);
	const prefix = `${PAT_PREFIX}${publicId}`;
	return { secret: `${prefix}_${secretPart}`, prefix };
}

export async function hashPat(secret: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isPatFormat(token: string): boolean {
	return token.startsWith(PAT_PREFIX) && token.length > PAT_PREFIX.length + 20;
}
